import type { Metadata } from "next";
import "@/styles/tokens.css";
import "@/styles/globals.css";
import "@/features/reading/reading.css";
import "@/features/reading/story.css";
import "@/features/home/home.css";
import "@/features/relationship/love-consultation.css";
export const metadata: Metadata = {
  title: "결 — 정통 사주 · 연애 사주 · 사주×MBTI",
  description:
    "태어난 여덟 글자에서 시작하는 나의 이야기. 정통 사주, 연애 사주, 사주와 MBTI를 만나요.",
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
