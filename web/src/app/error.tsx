"use client";

import Link from "next/link";

export default function ReadingError({ retry }: { retry: () => void }) {
  return (
    <main className="recovery-page">
      <span className="brand-mark">결</span>
      <h1>잠시 이야기를 불러오지 못했어요.</h1>
      <p>다시 시도하거나 서재에서 다른 이야기를 선택해주세요.</p>
      <button className="primary" onClick={retry}>
        다시 시도하기
      </button>
      <Link href="/">서재로 돌아가기 →</Link>
    </main>
  );
}
