import type { Metadata } from "next";
import "@/styles/tokens.css";
import "@/styles/globals.css";
import "@/features/relationship/reading.css";
export const metadata: Metadata = {
  title: "결 — 나의 관계를 읽는 사주",
  description:
    "사주와 내가 선택한 성격 유형, 두 가지 관점으로 읽는 나의 이야기.",
  robots: { index: false, follow: false },
  icons: { icon: "/favicon.svg" },
};
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <body>
        <div className="app-shell">{children}</div>
      </body>
    </html>
  );
}
