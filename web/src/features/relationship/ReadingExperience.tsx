"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { MBTI_TYPES } from "@/lib/birth-schema";
import { formatPrice, product } from "./product";
import {
  ELEMENTS,
  type BirthInput,
  type ReadingPreview,
  type FullReading,
  type Gender,
} from "@/types/reading";

const genderOptions: { value: Gender; label: string }[] = [
  { value: "female", label: "여성" },
  { value: "male", label: "남성" },
  { value: "other", label: "다른 성별" },
  { value: "undisclosed", label: "밝히지 않음" },
];
const genderLabel = Object.fromEntries(
  genderOptions.map(({ value, label }) => [value, label]),
) as Record<Gender, string>;

const initial: BirthInput = {
  nickname: "",
  gender: null,
  birthDate: "",
  calendar: "solar",
  leapMonth: false,
  birthTime: "",
  mbti: null,
  location: "KR",
};

export default function ReadingExperience() {
  const [input, setInput] = useState<BirthInput>(initial);
  const [view, setView] = useState<"input" | "result">("input");
  const [report, setReport] = useState<ReadingPreview | null>(null);
  const [full, setFull] = useState<FullReading | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const fullHeading = useRef<HTMLHeadingElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (checkoutOpen) {
      dialog.current?.showModal();
      document.body.style.overflow = "hidden";
    } else {
      dialog.current?.close();
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [checkoutOpen]);
  useEffect(() => {
    if (view === "result") {
      window.scrollTo(0, 0);
      heading.current?.focus({ preventScroll: true });
    }
  }, [view, report]);
  useEffect(() => {
    if (full) fullHeading.current?.focus();
  }, [full]);

  function update<K extends keyof BirthInput>(key: K, value: BirthInput[K]) {
    setInput((previous) => ({ ...previous, [key]: value }));
  }
  async function discard() {
    if (report)
      await fetch(`/api/reports/${report.id}`, { method: "DELETE" }).catch(
        () => {},
      );
  }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      await discard();
      const response = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      const data = await response.json();
      if (!response.ok)
        throw new Error(
          data.error || "결과를 만들지 못했어요. 잠시 후 다시 시도해주세요.",
        );
      setReport(data);
      setFull(null);
      setView("result");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "연결을 확인하고 다시 시도해주세요.",
      );
    } finally {
      setBusy(false);
    }
  }
  async function unlock() {
    if (!report || !confirmed || busy) return;
    setBusy(true);
    setError("");
    try {
      const response = await fetch(`/api/reports/${report.id}/demo-checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirmed: true }),
      });
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.error || "체험 주문을 완료하지 못했어요.");
      setCheckoutOpen(false);
      setFull(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "연결을 확인해주세요.");
    } finally {
      setBusy(false);
    }
  }
  function edit() {
    setView("input");
    setError("");
    setTimeout(() => inputRef.current?.focus(), 0);
  }
  async function reset() {
    await discard();
    setReport(null);
    setFull(null);
    setInput(initial);
    setView("input");
    setError("");
    window.scrollTo(0, 0);
    setTimeout(() => inputRef.current?.focus(), 0);
  }

  return (
    <>
      <header className="site-header">
        <a className="brand" href="/" aria-label="결 처음으로">
          <span className="brand-mark">결</span>
          <span className="brand-caption">나를 읽는 시간</span>
        </a>
        <span className="dev-badge">출시 전 체험</span>
      </header>
      <main>
        <nav className="journey" aria-label="체험 단계">
          <span aria-current={view === "input" ? "step" : undefined}>
            01 나의 시작
          </span>
          <i />
          <span aria-current={view === "result" && !full ? "step" : undefined}>
            02 무료로 읽기
          </span>
          <i />
          <span aria-current={full ? "step" : undefined}>03 깊이 읽기</span>
        </nav>
        {view === "input" ? (
          <section className="intro-grid">
            <div className="intro-copy">
              <p className="eyebrow">A STORY ONLY YOU CAN TELL</p>
              <h1>
                같은 유형,
                <br />
                다른 연애.
                <br />
                <em>당신만의 결.</em>
              </h1>
              <p className="intro-lead">
                사주와 내가 아는 성격을 나란히 놓고,
                <br />
                관계 속 나의 모습을 읽어보세요.
              </p>
              <div className="narrator-note">
                <span className="narrator-sign" aria-hidden="true">
                  結
                </span>
                <div>
                  <p>
                    “당신이 알고 있는 나와,
                    <br />
                    사주 속 이야기는 얼마나 닮았을까요?”
                  </p>
                  <small>{product.narrator.name}</small>
                </div>
              </div>
              <div className="chapter-teaser">
                <span>이번 이야기</span>
                <strong>나의 관계를 읽는 사주</strong>
                <p>기본 사주 · 성격 유형 비교 · 관계를 위한 질문</p>
              </div>
              <p className="scope-note">
                무료 요약을 먼저 읽고, 상세 리포트를 선택하세요.
                <br />
                현재는 모든 단계를 요금 없이 체험할 수 있어요.
              </p>
            </div>
            <section className="birth-card" aria-labelledby="birth-heading">
              <div className="card-kicker">
                <span>첫 장을 펼쳐볼까요?</span>
                <span>01 / 03</span>
              </div>
              <h2 id="birth-heading">당신의 시작을 알려주세요</h2>
              <p className="muted card-description">
                이름 대신 별명으로도 충분해요.
              </p>
              <form onSubmit={submit}>
                <fieldset disabled={busy}>
                  <div className="field">
                    <label htmlFor="nickname">
                      별명 <span className="optional">선택</span>
                    </label>
                    <input
                      ref={inputRef}
                      id="nickname"
                      maxLength={20}
                      placeholder="어떻게 불러드릴까요?"
                      value={input.nickname}
                      onChange={(e) => update("nickname", e.target.value)}
                      autoComplete="off"
                    />
                  </div>
                  <fieldset className="field">
                    <legend>성별</legend>
                    <div className="segmented gender-options">
                      {genderOptions.map(({ value, label }) => (
                        <label key={value}>
                          <input
                            type="radio"
                            name="gender"
                            value={value}
                            required
                            checked={input.gender === value}
                            onChange={() => update("gender", value)}
                          />
                          <span>{label}</span>
                        </label>
                      ))}
                    </div>
                    <small className="field-help">
                      현재 기본 사주 원국은 성별에 따라 달라지지 않아요. 대운은
                      아직 제공하지 않습니다.
                    </small>
                  </fieldset>
                  <fieldset className="field">
                    <legend>생년월일 기준</legend>
                    <div className="segmented">
                      {(["solar", "lunar"] as const).map((value) => (
                        <label key={value}>
                          <input
                            type="radio"
                            name="calendar"
                            value={value}
                            checked={input.calendar === value}
                            onChange={() =>
                              setInput((p) => ({
                                ...p,
                                calendar: value,
                                leapMonth: false,
                              }))
                            }
                          />
                          <span>{value === "solar" ? "양력" : "음력"}</span>
                        </label>
                      ))}
                    </div>
                  </fieldset>
                  {input.calendar === "lunar" && (
                    <label className="check-row leap-check">
                      <input
                        type="checkbox"
                        checked={input.leapMonth}
                        onChange={(e) => update("leapMonth", e.target.checked)}
                      />
                      음력 윤달에 태어났어요
                    </label>
                  )}
                  <div className="field">
                    <label htmlFor="birth-date">태어난 날짜</label>
                    <input
                      id="birth-date"
                      type={input.calendar === "lunar" ? "text" : "date"}
                      placeholder="YYYY-MM-DD"
                      pattern="[0-9]{4}-[0-9]{2}-[0-9]{2}"
                      min="1990-01-01"
                      max="2050-12-31"
                      required
                      value={input.birthDate}
                      onChange={(e) => update("birthDate", e.target.value)}
                      aria-describedby="date-help"
                    />
                    <small id="date-help" className="field-help">
                      {input.calendar === "lunar"
                        ? "음력 날짜를 YYYY-MM-DD 형식으로 입력하세요. "
                        : " "}
                      현재 체험은 1990년 이후 한국 출생 기준입니다.
                    </small>
                  </div>
                  <div className="field">
                    <div className="field-heading">
                      <label htmlFor="birth-time">태어난 시간</label>
                      <label className="check-row">
                        <input
                          type="checkbox"
                          checked={input.birthTime === null}
                          onChange={(e) =>
                            update("birthTime", e.target.checked ? null : "")
                          }
                        />
                        시간 모름
                      </label>
                    </div>
                    <input
                      id="birth-time"
                      type="time"
                      required={input.birthTime !== null}
                      disabled={input.birthTime === null}
                      value={input.birthTime ?? ""}
                      onChange={(e) => update("birthTime", e.target.value)}
                    />
                    {input.birthTime === null && (
                      <small className="field-help">
                        시주는 제외하고 읽어요. 절기 경계일에는 일부 해석도
                        제한됩니다.
                      </small>
                    )}
                  </div>
                  <div className="field">
                    <label htmlFor="mbti">
                      알고 있는 MBTI 유형 <span className="optional">선택</span>
                    </label>
                    <select
                      id="mbti"
                      value={input.mbti ?? ""}
                      onChange={(e) => update("mbti", e.target.value || null)}
                    >
                      <option value="">모름 / 사주만 보기</option>
                      {MBTI_TYPES.map((type) => (
                        <option key={type}>{type}</option>
                      ))}
                    </select>
                    <small className="field-help">
                      검사를 진행하지 않으며, 선택한 유형을 비교에 사용해요.
                    </small>
                  </div>
                  <details className="input-policy">
                    <summary>입력 정보와 계산 기준</summary>
                    <p>
                      한국 표준시(UTC+9), 자정에 날짜가 바뀌는 기준을
                      사용합니다. 출생지별 태양시 보정과 해외 출생은 아직
                      지원하지 않아요. 원국 계산은 베타이며 해설은 규칙 기반
                      초안입니다.
                    </p>
                    <p>
                      입력은 이 서버에서 처리되며, 리포트는 최대 1시간 임시
                      보관합니다. 외부 AI나 광고 서비스로 전송하지 않습니다.
                      정식 서비스 전환 시 정책을 다시 안내합니다.
                    </p>
                  </details>
                  {error && (
                    <p className="error-box" role="alert">
                      {error}
                    </p>
                  )}
                  <button className="primary" type="submit" disabled={busy}>
                    {busy
                      ? "사주 구성을 확인하고 있어요…"
                      : "나의 무료 요약 읽기"}
                    <span aria-hidden="true">↗</span>
                  </button>
                  <p className="button-note">
                    회원가입 없이 · 실제 요금 청구 없음
                  </p>
                </fieldset>
              </form>
            </section>
          </section>
        ) : (
          report && (
            <section className="reading-result">
              <div className="result-toolbar">
                <button className="text-button" onClick={edit}>
                  ← 입력 수정
                </button>
                <span>관계의 결 · {full ? "전체 체험" : "무료 요약"}</span>
              </div>
              <div className="result-hero">
                <p className="eyebrow">YOUR PERSONAL READING</p>
                <h1 ref={heading} tabIndex={-1}>
                  {report.nickname || "당신"}
                  {report.nickname ? "님" : ""}의 이야기를
                  <br />
                  <em>한 장씩 읽어볼까요.</em>
                </h1>
                <p className="birth-meta">
                  양력 {report.chart.solarDate} ·{" "}
                  {report.birthTime ?? "시간 모름"} ·{" "}
                  {genderLabel[report.gender]} · {report.mbti ?? "사주만 보기"}
                </p>
                <p className="draft-label">
                  원국 계산 베타 · 규칙 기반 해설 초안
                </p>
              </div>
              {report.chart.warnings.length > 0 && (
                <aside
                  className="calculation-notice"
                  aria-label="계산 참고사항"
                >
                  {report.chart.warnings.map((w) => (
                    <p key={w}>{w}</p>
                  ))}
                </aside>
              )}
              <section className="chart-card" aria-labelledby="chart-title">
                <div className="section-heading">
                  <div>
                    <p className="eyebrow">CHAPTER 01 · 무료</p>
                    <h2 id="chart-title">내 사주의 기본 구성</h2>
                  </div>
                  <span className="mini-label">
                    음력 {report.chart.lunarDate}
                  </span>
                </div>
                <div className="pillars">
                  {(["hour", "day", "month", "year"] as const).map((key) => {
                    const p = report.chart.pillars[key];
                    return (
                      <div
                        className={`pillar ${key === "day" ? "pillar-day" : ""}`}
                        key={key}
                      >
                        <span>
                          {
                            {
                              hour: "시주",
                              day: "일주",
                              month: "월주",
                              year: "년주",
                            }[key]
                          }
                        </span>
                        {p ? (
                          <>
                            <strong>{p.hanja}</strong>
                            <b>{p.korean}</b>
                            <small>{p.elements.join(" · ")}</small>
                          </>
                        ) : (
                          <>
                            <strong className="missing-pillar">—</strong>
                            <b>미확정</b>
                            <small>
                              {key === "hour" ? "시간 미입력" : "절기 경계"}
                            </small>
                          </>
                        )}
                        {key === "day" && (
                          <span className="day-marker">나의 기준</span>
                        )}
                      </div>
                    );
                  })}
                </div>
                <div className="elements" aria-label="원국 표면 오행 개수">
                  {ELEMENTS.map((el) => (
                    <div
                      key={el}
                      className={`element element-${ELEMENTS.indexOf(el)}`}
                    >
                      <span>{el}</span>
                      <strong>{report.chart.counts[el]}</strong>
                      <small>개</small>
                    </div>
                  ))}
                </div>
                <p className="chart-footnote">
                  표시된 천간·지지의 오행 개수입니다. 숨은 천간이나 계절
                  가중치를 반영한 강약 점수가 아닙니다.
                </p>
                <article className="reading-prose">
                  <h3>{report.intro.title}</h3>
                  <p>{report.intro.body}</p>
                  <blockquote>{report.intro.question}</blockquote>
                </article>
              </section>
              <section className="comparison-card">
                <p className="eyebrow">CHAPTER 02 · 무료</p>
                <h2>{report.comparison.title}</h2>
                <p>{report.comparison.body}</p>
                <blockquote>{report.comparison.question}</blockquote>
                <small>
                  유형 설명과 전통 해석을 비교하는 자기성찰 콘텐츠이며,
                  성격·미래를 진단하지 않습니다.
                </small>
              </section>
              {!full ? (
                <section className="paywall" aria-labelledby="paywall-title">
                  <div>
                    <p className="eyebrow">다음 장에서 만날 이야기</p>
                    <h2 id="paywall-title">
                      이제, 관계 속 나를
                      <br />
                      조금 더 깊이 읽어보세요.
                    </h2>
                    <ol className="chapter-list">
                      {product.chapters
                        .filter((c) => !c.free)
                        .map((chapter, index) => (
                          <li key={chapter.title}>
                            <span>0{index + 3}</span>
                            <div>
                              <strong>{chapter.title}</strong>
                              <p>{chapter.detail}</p>
                            </div>
                            <span className="lock-tag">전체 보기</span>
                          </li>
                        ))}
                    </ol>
                  </div>
                  <div className="purchase-card">
                    <span className="mini-label">상세 리포트 · 단건 상품</span>
                    <p className="price">{formatPrice(product.price)}</p>
                    <p className="price-note">출시 예정가 · 현재는 무료 체험</p>
                    <ul>
                      <li>안내된 세 가지 상세 챕터</li>
                      <li>사주와 선택한 유형을 함께 읽기</li>
                      <li>관계에 적용하는 질문과 대화 예시</li>
                    </ul>
                    <button
                      className="primary"
                      disabled={!report.demoAvailable}
                      onClick={() => {
                        setConfirmed(false);
                        setError("");
                        setCheckoutOpen(true);
                      }}
                    >
                      {report.demoAvailable
                        ? "전체 리포트 체험"
                        : "유료 서비스 준비 중"}
                      <span aria-hidden="true">↗</span>
                    </button>
                    <p className="button-note">
                      실제 결제 없이 구매 흐름만 체험합니다.
                    </p>
                  </div>
                </section>
              ) : (
                <section className="full-report">
                  <div className="report-divider">
                    <span>THE NEXT CHAPTER</span>
                    <span>체험 주문 완료 · 청구 없음</span>
                  </div>
                  <h2 ref={fullHeading} tabIndex={-1}>
                    관계의 결, 조금 더 깊이
                  </h2>
                  {full.chapters.map((chapter, index) => (
                    <article className="report-chapter" key={chapter.title}>
                      <span>0{index + 3}</span>
                      <div>
                        <h3>{chapter.title}</h3>
                        <p>{chapter.body}</p>
                        <blockquote>{chapter.question}</blockquote>
                      </div>
                    </article>
                  ))}
                  <div className="report-ending">
                    <p>
                      당신의 이야기는 정해져 있지 않아요.
                      <br />
                      다음 장은 당신의 선택으로 채워집니다.
                    </p>
                    <button className="secondary" onClick={reset}>
                      입력 정보 지우고 다시 시작
                    </button>
                    <small>
                      페이지를 닫거나 새로고침하면 결과 화면은 초기화됩니다.
                    </small>
                  </div>
                </section>
              )}
              {error && !checkoutOpen && (
                <p className="error-box" role="alert">
                  {error}
                </p>
              )}
            </section>
          )
        )}
      </main>
      <footer className="site-footer">
        <span className="brand-mark">결</span>
        <p>나를 이해하는 또 하나의 관점</p>
        <small>개발용 베타 · 미래나 관계의 결과를 보장하지 않습니다.</small>
      </footer>
      <dialog
        ref={dialog}
        className="checkout-dialog"
        onCancel={(event) => {
          if (busy) event.preventDefault();
          else setCheckoutOpen(false);
        }}
        onClose={() => setCheckoutOpen(false)}
        aria-labelledby="checkout-title"
      >
        <div className="dialog-top">
          <span className="eyebrow">PREVIEW CHECKOUT</span>
          <button
            className="dialog-close"
            onClick={() => setCheckoutOpen(false)}
            disabled={busy}
            aria-label="결제 체험 닫기"
          >
            ×
          </button>
        </div>
        <h2 id="checkout-title">전체 리포트를 열어볼까요?</h2>
        <p className="muted">실제 결제사에 연결되지 않은 개발용 주문입니다.</p>
        <div className="order-line">
          <span>{product.title}</span>
          <strong>{formatPrice(product.price)}</strong>
        </div>
        <div className="order-line order-total">
          <span>이번 체험 청구금액</span>
          <strong>0원</strong>
        </div>
        <label className="check-row checkout-consent">
          <input
            type="checkbox"
            checked={confirmed}
            disabled={busy}
            onChange={(e) => setConfirmed(e.target.checked)}
          />
          실제 결제가 아닌 체험임을 확인했어요.
        </label>
        {error && checkoutOpen && (
          <p className="error-box" role="alert">
            {error}
          </p>
        )}
        <button
          className="primary"
          disabled={!confirmed || busy}
          onClick={unlock}
        >
          {busy ? "체험 주문 처리 중…" : "0원으로 전체 체험하기"}
          <span aria-hidden="true">↗</span>
        </button>
        <p className="button-note">카드 정보 입력 · 자동결제 · 구독 없음</p>
      </dialog>
      <div className="sr-only" role="status" aria-live="polite">
        {busy ? "처리 중입니다. 잠시 기다려주세요." : ""}
      </div>
    </>
  );
}
