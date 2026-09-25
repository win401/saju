export const ELEMENTS = ["목", "화", "토", "금", "수"] as const;
export type Element = (typeof ELEMENTS)[number];
export const GENDERS = ["female", "male", "other", "undisclosed"] as const;
export type Gender = (typeof GENDERS)[number];
export const READING_THEMES = ["traditional", "love", "mbti"] as const;
export type ReadingTheme = (typeof READING_THEMES)[number];
export const RELATIONSHIP_FOCUSES = [
  "distance",
  "expression",
  "boundary",
] as const;
export type RelationshipFocus = (typeof RELATIONSHIP_FOCUSES)[number];
export type Pillar = {
  label: string;
  hanja: string;
  korean: string;
  elements: Element[];
};
export type BirthInput = {
  theme?: ReadingTheme;
  nickname: string;
  gender: Gender | null;
  birthDate: string;
  calendar: "solar" | "lunar";
  leapMonth: boolean;
  birthTime: string | null;
  mbti: string | null;
  location: "KR";
  focus?: RelationshipFocus | null;
};
export type Chart = {
  solarDate: string;
  lunarDate: string;
  pillars: {
    year: Pillar | null;
    month: Pillar | null;
    day: Pillar;
    hour: Pillar | null;
  };
  dayElement: Element;
  counts: Record<Element, number>;
  warnings: string[];
};
export type ReadingEvidence = {
  kind: "chart" | "mbti" | "focus";
  label: string;
  detail: string;
};
export type ChapterSection = {
  title: string;
  body: string;
  kind?: "reading" | "scene" | "voice" | "practice";
};
export type Chapter = {
  title: string;
  body: string;
  lead?: string;
  sections?: ChapterSection[];
  question: string;
  evidence: ReadingEvidence[];
};
export type ReadingPreview = {
  theme: ReadingTheme;
  id: string;
  nickname: string;
  gender: Gender;
  mbti: string | null;
  birthTime: string | null;
  focus: RelationshipFocus | null;
  chart: Chart;
  intro: Chapter;
  comparison: Chapter;
  demoAvailable: boolean;
};
export type FullReading = { chapters: Chapter[]; unlocked: true; mode: "demo" };
