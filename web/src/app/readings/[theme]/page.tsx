import { notFound } from "next/navigation";
import ReadingExperience from "@/features/reading/ReadingExperience";
import { READING_THEMES, type ReadingTheme } from "@/types/reading";
import { READING_PRODUCTS } from "@/features/reading/catalog";
import { isPublicDemoEnabled } from "@/lib/deployment-mode";

function validTheme(value: string): value is ReadingTheme {
  return (READING_THEMES as readonly string[]).includes(value);
}
export function generateStaticParams() {
  return READING_THEMES.map((theme) => ({ theme }));
}
export async function generateMetadata({
  params,
}: {
  params: Promise<{ theme: string }>;
}) {
  const { theme } = await params;
  return {
    title: validTheme(theme) ? `결 — ${READING_PRODUCTS[theme].name}` : "결",
  };
}
export default async function ReadingPage({
  params,
}: {
  params: Promise<{ theme: string }>;
}) {
  const { theme } = await params;
  if (!validTheme(theme)) notFound();
  return (
    <ReadingExperience
      key={theme}
      theme={theme}
      publicDemo={isPublicDemoEnabled()}
    />
  );
}
