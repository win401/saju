import Image from "next/image";
import Link from "next/link";
import LivingScene from "@/features/reading/LivingScene";

export default function HomePage() {
  return (
    <div className="home-page">
      <header className="home-header">
        <Link href="/" className="home-brand" aria-label="결 홈">
          <span className="home-brand-mark">결</span>
          <span>당신을 읽는 서재</span>
        </Link>
        <span className="home-preview-badge">포트폴리오 데모</span>
      </header>

      <main className="home-main">
        <section className="home-hero" aria-labelledby="home-title">
          <LivingScene />
          <span className="home-hero-note">여울의 서재 · GYEOL</span>
          <div className="home-hero-content">
            <p className="home-eyebrow">지금, 어떤 내가 궁금한가요</p>
            <h1 id="home-title">
              나를 읽는
              <br />세 가지 이야기
            </h1>
            <p className="home-hero-description">
              타고난 바탕부터 사랑하는 방식까지.
              <br />
              오늘의 마음이 머무는 책을 골라보세요.
            </p>
            <Link
              className="home-demo-link"
              href="/readings/traditional#quick-demo"
            >
              입력 없이 샘플로 둘러보기 <span aria-hidden="true">↗</span>
            </Link>
          </div>
          <span className="home-hero-seal" aria-hidden="true">
            結
          </span>
        </section>

        <nav className="home-quick-links" aria-label="사주 상품 바로가기">
          <Link href="/readings/traditional">
            <span aria-hidden="true">命</span>정통 사주
          </Link>
          <Link href="/readings/love">
            <span aria-hidden="true">緣</span>연애 사주
          </Link>
          <Link href="/readings/mbti">
            <span aria-hidden="true">我</span>사주 × MBTI
          </Link>
        </nav>

        <section
          className="home-collection"
          aria-labelledby="home-collection-title"
        >
          <div className="home-section-heading">
            <div>
              <p className="home-eyebrow">THREE READINGS</p>
              <h2 id="home-collection-title">당신을 위한 세 권의 책</h2>
            </div>
            <span className="home-collection-count">01 — 03</span>
          </div>

          <Link
            href="/readings/traditional"
            className="home-product home-traditional"
            aria-label="정통 사주 시작하기"
          >
            <div className="home-traditional-art" aria-hidden="true">
              <div className="home-orbit home-orbit-outer" />
              <div className="home-orbit home-orbit-inner" />
              <span className="home-traditional-character">命</span>
              <span className="home-traditional-side">四柱八字</span>
            </div>
            <div className="home-product-content">
              <span className="home-product-kicker">
                첫 번째 책 · 나의 바탕
              </span>
              <h3>정통 사주</h3>
              <p>
                여덟 글자에서 시작하는
                <br />
                나라는 사람의 큰 그림.
              </p>
              <ul className="home-product-topics" aria-label="정통 사주 주제">
                <li>기질</li>
                <li>재능과 일</li>
                <li>재물과 관계</li>
              </ul>
            </div>
            <div className="home-product-action">
              <span>정통 사주 시작하기</span>
              <span aria-hidden="true">↗</span>
            </div>
          </Link>

          <div className="home-secondary-products">
            <Link
              href="/readings/love"
              className="home-product home-love"
              aria-label="연애 사주 시작하기"
            >
              <div className="home-love-art" aria-hidden="true">
                <Image
                  src="/images/yeoul-portrait.png"
                  alt=""
                  fill
                  sizes="(max-width: 480px) 45vw, 210px"
                  className="home-love-image"
                />
                <span>緣</span>
              </div>
              <div className="home-secondary-content">
                <span className="home-product-kicker">
                  두 번째 책 · 마음의 거리
                </span>
                <h3>연애 사주</h3>
                <p>
                  끌리는 순간과
                  <br />
                  사랑이 전해지는 방식.
                </p>
                <div className="home-product-action">
                  <span>연애 사주 읽기</span>
                  <span aria-hidden="true">↗</span>
                </div>
              </div>
            </Link>

            <Link
              href="/readings/mbti"
              className="home-product home-mbti"
              aria-label="사주와 MBTI 함께 읽기"
            >
              <div className="home-mbti-art" aria-hidden="true">
                <span className="home-mbti-character">我</span>
                <span className="home-mbti-type">
                  I/E
                  <br />
                  N/S
                  <br />
                  F/T
                  <br />
                  J/P
                </span>
                <span className="home-mbti-cross">×</span>
              </div>
              <div className="home-secondary-content">
                <span className="home-product-kicker">
                  세 번째 책 · 두 가지 시선
                </span>
                <h3>사주 × MBTI</h3>
                <p>
                  사주가 그린 나와
                  <br />
                  내가 알고 있는 나.
                </p>
                <div className="home-product-action">
                  <span>두 시선으로 읽기</span>
                  <span aria-hidden="true">↗</span>
                </div>
              </div>
            </Link>
          </div>
        </section>

        <section className="home-guide" aria-labelledby="home-guide-title">
          <p className="home-eyebrow">A NOTE FROM YEOUL</p>
          <h2 id="home-guide-title">어디서부터 읽을까요?</h2>
          <p className="home-guide-intro">
            처음이라면 정통 사주로 나의 바탕을 만나보세요. 더 궁금한 마음은 다음
            이야기에서 이어가면 돼요.
          </p>
          <ol className="home-guide-steps">
            <li>
              <span>01</span>
              <p>궁금한 이야기 고르기</p>
            </li>
            <li>
              <span>02</span>
              <p>생년월일과 태어난 시간 입력하기</p>
            </li>
            <li>
              <span>03</span>
              <p>내 사주와 해설을 차례로 읽기</p>
            </li>
          </ol>
          <p className="home-guide-note">
            사주 × MBTI에서는 이미 알고 있는 유형을 직접 선택해요.
          </p>
        </section>

        <aside className="home-preview-note">
          <span className="home-preview-dot" aria-hidden="true" />
          <p>
            <strong>모든 사주 리포트를 무료로 읽어보세요.</strong>
            <br />
            포트폴리오 시연용 서비스예요. 회원가입과 실제 결제는 없어요.
          </p>
        </aside>
      </main>

      <footer className="home-footer">
        <span className="home-footer-brand">결</span>
        <p>정해진 답보다, 나를 조금 더 이해하는 시간.</p>
        <small>사주 해석은 자기이해를 위한 참고 콘텐츠입니다.</small>
      </footer>
    </div>
  );
}
