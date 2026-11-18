import Link from "next/link";

export default function NotFound() {
  return (
    <main className="recovery-page">
      <span className="brand-mark">결</span>
      <p className="eyebrow">404 · PAGE NOT FOUND</p>
      <h1>이 이야기는 서재에 없어요.</h1>
      <p>주소를 확인하거나, 세 가지 사주 이야기 중 하나를 골라보세요.</p>
      <Link className="primary" href="/">
        서재로 돌아가기 →
      </Link>
    </main>
  );
}
