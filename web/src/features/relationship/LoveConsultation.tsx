"use client";

import Image from "next/image";
import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import type { BirthInput } from "@/types/reading";
import {
  LOVE_STATUSES,
  LOVE_STATUS_LABELS,
  aiLoveReadingSchema,
  loveSituationSchema,
  type LoveAiAvailability,
  type LoveConsultationResponse,
  type LoveSituation,
} from "./ai-contract";

const suggestions = [
  "좋아하는 사람이 생기면 너무 서두르게 돼요. 어떻게 다가가면 좋을까요?",
  "연락하는 속도가 서로 달라요. 제 마음을 어떻게 전하면 좋을까요?",
  "상대에게 맞추다 제 마음을 놓치곤 해요. 어떤 기준을 세우면 좋을까요?",
];

export default function LoveConsultation({ input }: { input: BirthInput }) {
  const id = useId();
  const [availability, setAvailability] = useState<LoveAiAvailability | null>(
    null,
  );
  const [availabilityError, setAvailabilityError] = useState(false);
  const [availabilityAttempt, setAvailabilityAttempt] = useState(0);
  const [status, setStatus] = useState<LoveSituation["status"]>("single");
  const [question, setQuestion] = useState("");
  const [accessCode, setAccessCode] = useState("");
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<LoveConsultationResponse | null>(null);
  const [askedQuestion, setAskedQuestion] = useState("");
  const [isNextQuestion, setIsNextQuestion] = useState(false);
  const request = useRef<AbortController | null>(null);
  const mounted = useRef(false);
  const questionInput = useRef<HTMLTextAreaElement>(null);
  const resultHeading = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      request.current?.abort();
    };
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 10_000);
    let active = true;
    setAvailabilityError(false);
    async function checkAvailability() {
      try {
        const response = await fetch("/api/ai/love", {
          cache: "no-store",
          signal: controller.signal,
        });
        const data = (await response.json()) as LoveAiAvailability;
        if (
          !response.ok ||
          typeof data.available !== "boolean" ||
          typeof data.requiresAccessCode !== "boolean"
        ) {
          throw new Error("unavailable");
        }
        if (active) setAvailability(data);
      } catch {
        if (active) setAvailabilityError(true);
      } finally {
        window.clearTimeout(timeout);
      }
    }
    void checkAvailability();
    return () => {
      active = false;
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [availabilityAttempt]);

  useEffect(() => {
    if (result) resultHeading.current?.focus();
  }, [result]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (request.current || !availability?.available) return;
    const situation = loveSituationSchema.safeParse({ status, question });
    if (!situation.success) {
      setError("궁금한 상황을 8자 이상, 500자 이내로 알려주세요.");
      questionInput.current?.focus();
      return;
    }
    if (!consent) {
      setError("상담에 필요한 정보 전송에 동의해주세요.");
      return;
    }
    if (availability.requiresAccessCode && !accessCode.trim()) {
      setError("안내받은 체험 코드를 입력해주세요.");
      return;
    }

    const controller = new AbortController();
    request.current = controller;
    let timedOut = false;
    const timeout = window.setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, 55_000);
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/ai/love", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          input,
          situation: situation.data,
          consent: true,
          ...(availability.requiresAccessCode
            ? { accessCode: accessCode.trim() }
            : {}),
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(
          typeof data.error === "string"
            ? data.error
            : "지금은 답변을 완성하지 못했어요. 잠시 후 다시 시도해주세요.",
        );
      }
      const reading = aiLoveReadingSchema.safeParse(data.reading);
      if (
        data.source !== "openai" ||
        !reading.success ||
        !Array.isArray(data.evidence) ||
        !data.evidence.every(
          (item: unknown) =>
            typeof item === "object" &&
            item !== null &&
            "id" in item &&
            typeof item.id === "string" &&
            "label" in item &&
            typeof item.label === "string" &&
            "detail" in item &&
            typeof item.detail === "string",
        ) ||
        typeof data.limitation !== "string"
      ) {
        throw new Error("답변을 온전히 받아오지 못했어요. 다시 시도해주세요.");
      }
      if (mounted.current && !controller.signal.aborted) {
        setAskedQuestion(situation.data.question);
        setResult({ ...data, reading: reading.data });
      }
    } catch (cause) {
      if (mounted.current) {
        setError(
          timedOut
            ? "답변 준비가 길어지고 있어요. 잠시 후 다시 시도해주세요."
            : cause instanceof Error && cause.name !== "AbortError"
              ? cause.message
              : "연결을 확인하고 다시 시도해주세요.",
        );
      }
    } finally {
      window.clearTimeout(timeout);
      if (request.current === controller) request.current = null;
      if (mounted.current) setBusy(false);
    }
  }

  function askNext() {
    if (!result) return;
    setQuestion("");
    setConsent(false);
    setError("");
    setResult(null);
    setIsNextQuestion(true);
    window.setTimeout(() => questionInput.current?.focus(), 0);
  }

  if (!availability?.available) {
    return (
      <aside className="ai-love ai-love--quiet" aria-labelledby={`${id}-title`}>
        <span className="ai-love-kicker">여울의 상담실</span>
        <h2 id={`${id}-title`}>여울의 AI 상담 준비 중</h2>
        <p role="status">
          {availabilityError
            ? "상담실 연결을 확인하지 못했어요. 잠시 후 다시 확인해주세요."
            : availability
              ? "지금은 아래 연애 리포트를 읽을 수 있어요. 나의 고민을 직접 묻는 상담도 곧 만나요."
              : "상담실이 열려 있는지 확인하고 있어요."}
        </p>
        {availabilityError && (
          <button
            className="ai-love-text-button"
            onClick={() => setAvailabilityAttempt((value) => value + 1)}
            type="button"
          >
            연결 다시 확인하기
          </button>
        )}
      </aside>
    );
  }

  return (
    <section className="ai-love" aria-labelledby={`${id}-title`}>
      <header className="ai-love-header">
        <Image
          className="ai-love-portrait"
          src="/images/yeoul-portrait.png"
          alt=""
          width={64}
          height={76}
          sizes="64px"
        />
        <div>
          <span className="ai-love-kicker">여울의 상담실 · 무료 체험</span>
          <h2 id={`${id}-title`}>지금, 마음에 걸리는 게 있나요?</h2>
          <p>사주와 지금의 고민을 함께 읽어볼게요.</p>
        </div>
      </header>

      {result ? (
        <div className="ai-love-result" data-testid="ai-love-result">
          <div className="ai-love-my-question">
            <span>내가 건넨 이야기</span>
            <p>{askedQuestion}</p>
          </div>
          <div className="ai-love-answer">
            <span className="ai-love-answer-label">
              여울 · AI가 작성한 상담
            </span>
            <h3 ref={resultHeading} tabIndex={-1}>
              {result.reading.title}
            </h3>
            <p className="ai-love-opening">{result.reading.opening}</p>
            {result.reading.sections.map((section, index) => (
              <section className="ai-love-answer-section" key={index}>
                <h4>
                  <span aria-hidden="true">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  {section.title}
                </h4>
                {section.paragraphs.map((paragraph, paragraphIndex) => (
                  <p key={paragraphIndex}>{paragraph}</p>
                ))}
              </section>
            ))}
            <blockquote className="ai-love-takeaway">
              <span>오늘 마음에 남겨둘 한 가지</span>
              <p>{result.reading.takeaway}</p>
            </blockquote>
            <details className="ai-love-evidence">
              <summary>어떤 사주 정보를 참고했나요?</summary>
              <ul>
                {result.evidence.map((evidence) => (
                  <li key={evidence.id}>
                    <strong>{evidence.label}</strong>
                    <p>{evidence.detail}</p>
                  </li>
                ))}
              </ul>
            </details>
            <p className="ai-love-limitation">{result.limitation}</p>
          </div>
          <div className="ai-love-next">
            <span>다음 이야기를 위한 질문</span>
            <p>{result.reading.nextQuestion}</p>
            <button className="ai-love-submit" type="button" onClick={askNext}>
              다른 고민 물어보기 <span aria-hidden="true">↗</span>
            </button>
            <small>이전 대화는 전송하지 않고 새 질문으로 상담해요.</small>
          </div>
        </div>
      ) : (
        <form onSubmit={submit} className="ai-love-form" aria-busy={busy}>
          {isNextQuestion && (
            <p className="ai-love-new-question">
              더 이야기하고 싶은 고민을 적어주세요. 앞선 대화는 전송하지 않고,
              아래 질문과 사주 정보로 새 답변을 만들어요.
            </p>
          )}
          <fieldset disabled={busy} className="ai-love-status">
            <legend>지금 나의 연애는</legend>
            <div className="ai-love-options">
              {LOVE_STATUSES.map((value) => (
                <label key={value}>
                  <input
                    type="radio"
                    name={`${id}-status`}
                    value={value}
                    checked={status === value}
                    onChange={() => {
                      setStatus(value);
                      setConsent(false);
                    }}
                  />
                  <span>{LOVE_STATUS_LABELS[value]}</span>
                </label>
              ))}
            </div>
          </fieldset>
          <div className="ai-love-question-field">
            <label htmlFor={`${id}-question`}>여울에게 묻고 싶은 이야기</label>
            <textarea
              id={`${id}-question`}
              ref={questionInput}
              value={question}
              onChange={(event) => {
                setQuestion(event.target.value);
                setConsent(false);
              }}
              placeholder="어떤 상황에서 마음이 복잡한지, 가장 궁금한 한 가지를 들려주세요."
              minLength={8}
              maxLength={500}
              rows={5}
              required
              disabled={busy}
              aria-describedby={`${id}-question-help ${id}-question-count`}
            />
            <div className="ai-love-question-meta">
              <small id={`${id}-question-help`}>
                이름·연락처 등 개인정보는 쓰지 마세요.
              </small>
              <small id={`${id}-question-count`}>{question.length} / 500</small>
            </div>
          </div>
          <div className="ai-love-suggestions" aria-label="질문 예시">
            <span>말문이 막힌다면</span>
            {suggestions.map((suggestion) => (
              <button
                type="button"
                disabled={busy}
                key={suggestion}
                onClick={() => {
                  setQuestion(suggestion);
                  setConsent(false);
                  questionInput.current?.focus();
                }}
              >
                {suggestion}
              </button>
            ))}
          </div>
          {availability.requiresAccessCode && (
            <div className="ai-love-code-field">
              <label htmlFor={`${id}-code`}>체험 코드</label>
              <input
                id={`${id}-code`}
                type="password"
                value={accessCode}
                onChange={(event) => setAccessCode(event.target.value)}
                autoComplete="off"
                spellCheck={false}
                autoCapitalize="none"
                maxLength={200}
                required
                disabled={busy}
                placeholder="안내받은 체험 코드를 입력해주세요"
              />
            </div>
          )}
          <div className="ai-love-privacy">
            <label className="ai-love-consent">
              <input
                type="checkbox"
                checked={consent}
                onChange={(event) => setConsent(event.target.checked)}
                required
                disabled={busy}
              />
              <span>AI 상담에 필요한 정보 전송에 동의해요.</span>
            </label>
            <p>
              계산한 사주 요약, 연애 상태, 질문이 OpenAI로 전송돼요. 입력한
              생년월일·시간, 별명·성별은 별도 항목으로 보내지 않아요. 질문에는
              개인정보를 넣지 마세요.
            </p>
            <p>
              상담 결과는 이 화면에만 표시돼요. OpenAI의 보관·처리 정책이
              적용돼요.{" "}
              <a
                href="https://developers.openai.com/api/docs/guides/your-data"
                target="_blank"
                rel="noopener noreferrer"
              >
                데이터 처리 안내
              </a>
            </p>
          </div>
          {error && (
            <p className="ai-love-error" role="alert">
              {error}
            </p>
          )}
          <button className="ai-love-submit" type="submit" disabled={busy}>
            {busy
              ? "여울이 이야기를 읽고 있어요"
              : error
                ? "상담 다시 요청하기"
                : "여울에게 내 마음 묻기"}
            {busy ? (
              <span className="ai-love-spinner" aria-hidden="true" />
            ) : (
              <span aria-hidden="true">↗</span>
            )}
          </button>
          <p className="ai-love-form-note" role="status">
            {busy
              ? "사주와 고민을 함께 읽는 중이에요. 잠시만 기다려주세요."
              : "체험 중에는 결제 없이 이용해요. 새로고침하면 상담 내용이 사라져요."}
          </p>
        </form>
      )}
    </section>
  );
}
