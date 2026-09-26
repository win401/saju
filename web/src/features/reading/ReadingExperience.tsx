"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import { MBTI_TYPES } from "@/lib/birth-schema";
import { formatPrice, READING_PRODUCTS } from "./catalog";
import ExplanationBasis from "./ExplanationBasis";
import ChapterNarrative from "./ChapterNarrative";
import LoveConsultation from "@/features/relationship/LoveConsultation";
import useBirthProfile from "./useBirthProfile";
import {
  ELEMENTS,
  READING_THEMES,
  type BirthInput,
  type ReadingPreview,
  type FullReading,
  type Gender,
  type RelationshipFocus,
  type ReadingTheme,
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

const storyPaths = [
  {
    id: "distance",
    number: "01",
    title: "가까워지는 속도",
    scene: "다가가고 싶은데, 한 발 늦추게 될 때",
    reply: "마음의 속도가 다른 날부터 펼쳐볼게요.",
    chapter: "가까워지는 나만의 속도",
  },
  {
    id: "expression",
    number: "02",
    title: "마음을 전하는 말",
    scene: "분명 마음은 있는데, 말이 잘 나오지 않을 때",
    reply: "말하지 못한 마음의 장면부터 볼게요.",
    chapter: "마음을 전하는 방법",
  },
  {
    id: "boundary",
    number: "03",
    title: "나를 지키는 기준",
    scene: "상대에게 맞추다 내 마음을 놓칠 때",
    reply: "나를 지키는 기준부터 짚어볼게요.",
    chapter: "좋아하는데 자꾸 어긋나는 순간",
  },
] as const;

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

export default function ReadingExperience({
  theme,
  publicDemo = false,
}: {
  theme: ReadingTheme;
  publicDemo?: boolean;
}) {
  const product = READING_PRODUCTS[theme];
  const {
    input,
    setInput,
    ready: profileReady,
    remember,
    changeRemember,
    savedProfile,
    storageMessage,
    save: saveProfile,
    clear: clearProfile,
  } = useBirthProfile(theme, initial);
  const [view, setView] = useState<"input" | "result">("input");
  const [report, setReport] = useState<ReadingPreview | null>(null);
  const [reportInput, setReportInput] = useState<BirthInput | null>(null);
  const [full, setFull] = useState<FullReading | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [storyPath, setStoryPath] = useState<RelationshipFocus | null>(null);
  const [activeChapter, setActiveChapter] = useState(0);
  const dialog = useRef<HTMLDialogElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const fullHeading = useRef<HTMLHeadingElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const formSection = useRef<HTMLElement>(null);
  const pathSection = useRef<HTMLElement>(null);
  const chapterHeading = useRef<HTMLHeadingElement>(null);
  const chosenPath = storyPaths.find(
    (path) => path.id === (view === "result" ? report?.focus : storyPath),
  );

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
    if (report && report.demoMode !== "public")
      await fetch(`/api/reports/${report.id}`, { method: "DELETE" }).catch(
        () => {},
      );
  }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy || !profileReady) return;
    setBusy(true);
    setError("");
    try {
      await discard();
      const submittedInput: BirthInput = {
        ...input,
        theme,
        mbti: theme === "mbti" ? input.mbti : null,
        focus: theme === "love" ? storyPath : null,
      };
      const response = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(submittedInput),
      });
      const data = await response.json();
      if (!response.ok)
        throw new Error(
          data.error || "결과를 만들지 못했어요. 잠시 후 다시 시도해주세요.",
        );
      setReport(data);
      setReportInput(submittedInput);
      saveProfile();
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
      const publicReading = report.demoMode === "public";
      if (publicReading && !reportInput)
        throw new Error("입력 화면에서 다시 시작해주세요.");
      const response = await fetch(
        publicReading
          ? "/api/demo/readings"
          : `/api/reports/${report.id}/demo-checkout`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(
            publicReading
              ? { confirmed: true, input: reportInput }
              : { confirmed: true },
          ),
        },
      );
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.error || "체험 주문을 완료하지 못했어요.");
      const selectedChapter = data.chapters.findIndex(
        (chapter: { title: string }) => chapter.title === chosenPath?.chapter,
      );
      setActiveChapter(Math.max(0, selectedChapter));
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
    setReportInput(null);
    setFull(null);
    clearProfile();
    setStoryPath(null);
    setActiveChapter(0);
    setView("input");
    setError("");
    window.scrollTo(0, 0);
    setTimeout(() => inputRef.current?.focus(), 0);
  }
  function changeChapter(index: number) {
    setActiveChapter(index);
    window.setTimeout(() => chapterHeading.current?.focus(), 0);
  }
  function scrollTo(section: HTMLElement | null) {
    section?.scrollIntoView({
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "auto"
        : "smooth",
    });
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
        {view === "input" && theme === "love" && (
          <section className="story-hero" aria-labelledby="story-title">
            <Image
              className="story-hero-image"
              src="/images/yeoul-thread-room.png"
              alt="여울이 세 갈래로 이어지는 빛의 실을 건네는 서재"
              fill
              sizes="(max-width: 480px) 100vw, 480px"
              priority
            />
            <div className="story-sparks" aria-hidden="true">
              <i />
              <i />
              <i />
              <i />
            </div>
            <div className="story-topline">
              <span>결 · {product.name}</span>
              <span>SCENE 01 / 03</span>
            </div>
            <div className="story-hero-content">
              <span className="story-speaker">여울이 건네는 첫 장</span>
              <h1 id="story-title">
                {product.heroTitle[0]}
                <br />
                <em>{product.heroTitle[1]}</em>
              </h1>
              <p>{product.subtitle}</p>
              <button
                className="story-enter"
                type="button"
                onClick={() => scrollTo(pathSection.current)}
              >
                나의 이야기 시작하기 <span aria-hidden="true">↘</span>
              </button>
            </div>
            <span className="story-scroll-hint" aria-hidden="true">
              SCROLL TO BEGIN ↓
            </span>
          </section>
        )}
        {view === "input" && theme !== "love" && (
          <section
            className={`book-intro book-intro-${theme}`}
            aria-labelledby="book-title"
          >
            <Link href="/" className="book-back">
              ← 모든 이야기
            </Link>
            <div className="book-masthead">
              <span>결의 서재 · {product.name}</span>
              <span>VOL. {theme === "traditional" ? "01" : "03"}</span>
            </div>
            <div className="book-emblem" aria-hidden="true">
              {product.symbol}
            </div>
            <p className="eyebrow">{product.name}</p>
            <h1 id="book-title">
              {product.heroTitle[0]}
              <br />
              <em>{product.heroTitle[1]}</em>
            </h1>
            <p className="book-description">{product.intro}</p>
            <div className="book-tags">
              <span>
                {theme === "traditional"
                  ? "원국 · 오행 · 십성"
                  : "선택한 MBTI × 원국"}
              </span>
              <span>무료 2장 + 상세 4장</span>
            </div>
            <button
              type="button"
              className="primary"
              onClick={() => scrollTo(formSection.current)}
            >
              내 이야기 펼치기 <span aria-hidden="true">↓</span>
            </button>
            <details className="book-contents">
              <summary>이 책에서 읽게 될 이야기</summary>
              <ol>
                {product.chapters.map((item) => (
                  <li key={item.title}>
                    <strong>{item.title}</strong>
                    <span>{item.free ? "무료" : "상세"}</span>
                    <p>{item.detail}</p>
                  </li>
                ))}
              </ol>
            </details>
          </section>
        )}
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
            {theme === "love" && (
              <section
                className="path-stage"
                ref={pathSection}
                aria-labelledby="path-heading"
              >
                <div className="stage-index">
                  <span>THE FIRST THREAD</span>
                  <span>01 — 03</span>
                </div>
                <p className="stage-kicker">여울의 질문</p>
                <h2 id="path-heading">
                  지금, 어느 장면이
                  <br />
                  가장 마음에 남나요?
                </h2>
                <p className="path-intro">
                  정답을 고르는 검사가 아니에요. 이번 이야기에서 먼저 읽고 싶은
                  장면을 골라주세요.
                </p>
                <div
                  className="path-list"
                  role="group"
                  aria-label="먼저 읽고 싶은 관계 장면"
                >
                  {storyPaths.map((path) => (
                    <button
                      className={`path-option ${storyPath === path.id ? "is-selected" : ""}`}
                      type="button"
                      key={path.id}
                      aria-pressed={storyPath === path.id}
                      onClick={() => setStoryPath(path.id)}
                    >
                      <span className="path-number">{path.number}</span>
                      <span className="path-copy">
                        <strong>{path.title}</strong>
                        <small>{path.scene}</small>
                      </span>
                      <span className="path-arrow" aria-hidden="true">
                        ↗
                      </span>
                    </button>
                  ))}
                </div>
                <div className="guide-reply" aria-live="polite">
                  <Image
                    src="/images/yeoul-portrait.png"
                    alt=""
                    width={68}
                    height={82}
                    sizes="68px"
                  />
                  <p>
                    <b>여울</b>
                    <br />
                    {chosenPath?.reply ??
                      "실 하나를 골라주면, 그 장면부터 함께 읽을게요."}
                  </p>
                </div>
                <button
                  className="path-continue"
                  type="button"
                  onClick={() => scrollTo(formSection.current)}
                >
                  이제 내 정보를 적을게요 <span aria-hidden="true">↓</span>
                </button>
              </section>
            )}
            <section
              className="birth-card"
              ref={formSection}
              aria-labelledby="birth-heading"
            >
              <div className="card-kicker">
                <span>{product.name} · 내 정보 입력</span>
                <span>INPUT</span>
              </div>
              <h2 id="birth-heading">당신의 시작을 알려주세요</h2>
              <p className="muted card-description">
                이름 대신 별명으로도 충분해요.{" "}
                {chosenPath
                  ? `‘${chosenPath.title}’을 먼저 읽어요.`
                  : theme === "traditional"
                    ? "MBTI 없이 출생정보로 사주를 읽어요."
                    : theme === "mbti"
                      ? "알고 있는 MBTI를 함께 선택해주세요."
                      : "관심 장면은 위에서 선택할 수 있어요."}
              </p>
              {savedProfile && (
                <div className="saved-profile">
                  <span className="saved-profile-kicker">
                    기억해 둔 내 정보
                  </span>
                  <strong>저장된 내 정보를 불러왔어요.</strong>
                  <p>
                    필요한 정보만 수정하고 바로 읽어보세요.
                    {theme === "mbti" && !input.mbti
                      ? " MBTI 유형만 추가로 선택하면 돼요."
                      : ""}
                  </p>
                  <div className="saved-profile-actions">
                    <small>
                      {new Intl.DateTimeFormat("ko-KR", {
                        month: "numeric",
                        day: "numeric",
                        hour: "numeric",
                        minute: "2-digit",
                      }).format(savedProfile.expiresAt)}
                      까지 기억해요
                    </small>
                    <button
                      className="text-button"
                      type="button"
                      onClick={() => {
                        clearProfile();
                        inputRef.current?.focus();
                      }}
                      disabled={busy}
                    >
                      저장된 정보 삭제
                    </button>
                  </div>
                </div>
              )}
              <form onSubmit={submit}>
                <fieldset disabled={busy || !profileReady}>
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
                  {theme === "mbti" && (
                    <div className="field">
                      <label htmlFor="mbti">알고 있는 MBTI 유형</label>
                      <select
                        id="mbti"
                        required
                        value={input.mbti ?? ""}
                        onChange={(e) => update("mbti", e.target.value || null)}
                      >
                        <option value="">유형을 선택해주세요</option>
                        {MBTI_TYPES.map((type) => (
                          <option key={type}>{type}</option>
                        ))}
                      </select>
                      <small className="field-help">
                        별도 검사는 제공하지 않아요. 유형을 모르면{" "}
                        <Link href="/readings/traditional">정통 사주</Link>로
                        읽을 수 있어요.
                      </small>
                    </div>
                  )}
                  <div className="remember-profile">
                    <label className="check-row">
                      <input
                        type="checkbox"
                        checked={remember}
                        onChange={(e) => changeRemember(e.target.checked)}
                        aria-describedby="remember-profile-help"
                      />
                      이 브라우저에 내 정보 24시간 기억하기
                    </label>
                    <p id="remember-profile-help">
                      무료 요약을 읽으면 출생정보와 선택한 MBTI를 기억해요. 같은
                      브라우저에서 다른 콘텐츠를 볼 때 다시 입력하지 않아도
                      돼요. 공용 기기에서는 꺼주세요.
                    </p>
                  </div>
                  {storageMessage && (
                    <p className="profile-status" role="status">
                      {storageMessage}
                    </p>
                  )}
                  <details className="input-policy">
                    <summary>입력 정보와 계산 기준</summary>
                    <p>
                      한국 표준시(UTC+9), 자정에 날짜가 바뀌는 기준을
                      사용합니다. 출생지별 태양시 보정과 해외 출생은 아직
                      지원하지 않아요. 원국 계산은 베타이며, 이야기에 담긴 해석
                      문안은 검수 중입니다.
                    </p>
                    <p>
                      {publicDemo
                        ? "이 무료 체험은 요청할 때마다 서버에서 결과를 계산하며, 앱 데이터베이스·서버 저장소·쿠키에 출생정보와 리포트를 보관하지 않습니다. 전체 체험 시 같은 입력을 한 번 더 전송합니다."
                        : "출생정보·선택 유형·관심 장면은 서버에서 처리되며, 리포트는 최대 1시간 임시 보관합니다."}{" "}
                      기본 해설은 외부 AI나 광고 서비스로 전송하지 않습니다.
                      연애 사주의 AI 상담을 별도로 요청하면, 전송 항목을
                      안내하고 동의받은 뒤 OpenAI로 상담 정보를 전송합니다.
                    </p>
                    <p>
                      ‘내 정보 기억하기’를 켜면 무료 요약을 읽은 시점부터 24시간
                      동안 별명·성별·생년월일·양력/음력·윤달 여부·출생 시간·한국
                      출생 기준·선택한 MBTI를 이 브라우저에 보관해요. 기간이
                      지나면 다시 불러오지 않으며, 입력 화면을 열 때 만료된
                      정보를 정리해요. 저장을 끄거나 ‘저장된 정보 삭제’로 지울
                      수 있어요. 상담 질문·체험 코드·동의 여부·결과는 저장하지
                      않으며, 새로고침하면 결과 화면은 초기화돼요.
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
                <span>
                  {product.name} · {full ? "전체 체험" : "무료 해설"}
                </span>
              </div>
              {storageMessage && (
                <p className="profile-status" role="status">
                  {storageMessage}
                </p>
              )}
              <nav className="related-readings" aria-label="다른 콘텐츠 읽기">
                {READING_THEMES.filter((value) => value !== theme).map(
                  (value) => (
                    <Link key={value} href={`/readings/${value}`}>
                      {READING_PRODUCTS[value].name}
                      <span aria-hidden="true">↗</span>
                    </Link>
                  ),
                )}
              </nav>
              <div className="result-hero">
                <div className="result-scene" aria-hidden="true">
                  <Image
                    src="/images/yeoul-thread-room.png"
                    alt=""
                    fill
                    sizes="(max-width: 480px) 100vw, 480px"
                  />
                </div>
                <p className="eyebrow">여울의 서재 · {product.name}</p>
                <h1 ref={heading} tabIndex={-1}>
                  {report.nickname || "당신"}
                  {report.nickname ? "님" : ""}의 이야기를
                  <br />
                  <em>한 장씩 읽어볼까요.</em>
                </h1>
                <p className="result-guide-line">
                  {chosenPath
                    ? `“${chosenPath.reply}”`
                    : "“여기서부터 당신의 결을 함께 읽어볼게요.”"}
                </p>
                <p className="birth-meta">
                  양력 {report.chart.solarDate} ·{" "}
                  {report.birthTime ?? "시간 모름"} ·{" "}
                  {genderLabel[report.gender]} · {report.mbti ?? "사주만 보기"}
                </p>
                <p className="draft-label">
                  원국 계산 베타 · 해석 문안 검수 중
                </p>
              </div>
              {chosenPath && (
                <div className="chosen-path-note">
                  <span>내가 고른 장면</span>
                  <strong>{chosenPath.title}</strong>
                  <p>
                    아래 무료 해설로 나의 기본 결을 먼저 읽고, 상세 리포트에서
                    이 장면을 이어서 볼 수 있어요.
                  </p>
                </div>
              )}
              {theme === "love" && reportInput && (
                <LoveConsultation key={report.id} input={reportInput} />
              )}
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
                  <ChapterNarrative chapter={report.intro} />
                  <blockquote>{report.intro.question}</blockquote>
                  <ExplanationBasis evidence={report.intro.evidence} />
                </article>
              </section>
              <section className="comparison-card">
                <p className="eyebrow">CHAPTER 02 · 무료</p>
                <h2>{report.comparison.title}</h2>
                <ChapterNarrative
                  chapter={report.comparison}
                  headingLevel={3}
                />
                <blockquote>{report.comparison.question}</blockquote>
                <ExplanationBasis evidence={report.comparison.evidence} />
                <small>
                  {theme === "mbti"
                    ? "입력한 유형과 전통 해석을 비교하는 콘텐츠입니다."
                    : "전통의 상징을 바탕으로 풀어쓴 사주 해석입니다."}{" "}
                  성격이나 미래를 확정하지 않습니다.
                </small>
              </section>
              {!full ? (
                <section className="paywall" aria-labelledby="paywall-title">
                  <div>
                    <p className="eyebrow">다음 장에서 만날 이야기</p>
                    <h2 id="paywall-title">
                      {product.name},
                      <br />
                      다음 네 장을 펼쳐보세요.
                    </h2>
                    <ol className="chapter-list">
                      {product.chapters
                        .filter((c) => !c.free)
                        .map((chapter, index) => (
                          <li
                            className={
                              chapter.title === chosenPath?.chapter
                                ? "is-chosen-chapter"
                                : ""
                            }
                            key={chapter.title}
                          >
                            <span>0{index + 3}</span>
                            <div>
                              <strong>{chapter.title}</strong>
                              <p>{chapter.detail}</p>
                            </div>
                            <span className="lock-tag">
                              {chapter.title === chosenPath?.chapter
                                ? "내가 고른 장면"
                                : "전체 보기"}
                            </span>
                          </li>
                        ))}
                    </ol>
                  </div>
                  <div className="purchase-card">
                    <span className="mini-label">상세 리포트 · 단건 상품</span>
                    <p className="price">{formatPrice(product.price)}</p>
                    <p className="price-note">출시 예정가 · 현재는 무료 체험</p>
                    <ul>
                      <li>안내된 네 가지 상세 챕터</li>
                      <li>
                        {theme === "mbti"
                          ? "사주와 선택한 유형을 함께 읽기"
                          : theme === "traditional"
                            ? "재능·일과 재물·대인관계 종합 해설"
                            : "끌림·표현·갈등·나에게 맞는 관계"}
                      </li>
                      <li>해석에 사용한 사주 단서 확인</li>
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
                    {product.fullTitle}
                  </h2>
                  <div className="chapter-reader">
                    <div
                      className="chapter-progress"
                      aria-label={`상세 챕터 ${activeChapter + 1} / ${full.chapters.length}`}
                    >
                      {full.chapters.map((chapter, index) => (
                        <button
                          key={chapter.title}
                          type="button"
                          aria-label={`${index + 1}장 ${chapter.title} 열기`}
                          aria-current={
                            activeChapter === index ? "step" : undefined
                          }
                          onClick={() => changeChapter(index)}
                        >
                          <span />
                        </button>
                      ))}
                    </div>
                    <article className="report-chapter" key={activeChapter}>
                      <span>0{activeChapter + 3}</span>
                      <div>
                        <p className="chapter-scene-label">
                          {product.name} · {activeChapter + 1}번째 장
                        </p>
                        <h3 ref={chapterHeading} tabIndex={-1}>
                          {full.chapters[activeChapter].title}
                        </h3>
                        <ChapterNarrative
                          chapter={full.chapters[activeChapter]}
                        />
                        <blockquote>
                          {full.chapters[activeChapter].question}
                        </blockquote>
                        <ExplanationBasis
                          evidence={full.chapters[activeChapter].evidence}
                        />
                      </div>
                    </article>
                    <div className="chapter-controls">
                      <button
                        type="button"
                        onClick={() => changeChapter(activeChapter - 1)}
                        disabled={activeChapter === 0}
                      >
                        ← 이전 장
                      </button>
                      <span>
                        {String(activeChapter + 1).padStart(2, "0")} /{" "}
                        {String(full.chapters.length).padStart(2, "0")}
                      </span>
                      <button
                        type="button"
                        onClick={() => changeChapter(activeChapter + 1)}
                        disabled={activeChapter === full.chapters.length - 1}
                      >
                        다음 장 →
                      </button>
                    </div>
                  </div>
                  {activeChapter === full.chapters.length - 1 && (
                    <div className="report-ending">
                      <p>
                        당신의 이야기는 정해져 있지 않아요.
                        <br />
                        다음 장은 당신의 선택으로 채워집니다.
                      </p>
                      <button className="secondary" onClick={reset}>
                        입력 정보 지우고 다시 시작
                      </button>
                      <Link className="other-readings" href="/">
                        다른 이야기 둘러보기 →
                      </Link>
                      <small>
                        페이지를 닫거나 새로고침하면 결과 화면은 초기화됩니다.
                      </small>
                    </div>
                  )}
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
