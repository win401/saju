export const ELEMENTS = ["목", "화", "토", "금", "수"] as const;
export type Element = (typeof ELEMENTS)[number];
export const GENDERS = ["female", "male", "other", "undisclosed"] as const;
export type Gender = (typeof GENDERS)[number];
export type Pillar = {
  label: string;
  hanja: string;
  korean: string;
  elements: Element[];
};
export type BirthInput = {
  nickname: string;
  gender: Gender | null;
  birthDate: string;
  calendar: "solar" | "lunar";
  leapMonth: boolean;
  birthTime: string | null;
  mbti: string | null;
  location: "KR";
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
export type Chapter = { title: string; body: string; question: string };
export type ReadingPreview = {
  id: string;
  nickname: string;
  gender: Gender;
  mbti: string | null;
  birthTime: string | null;
  chart: Chart;
  intro: Chapter;
  comparison: Chapter;
  demoAvailable: boolean;
};
export type FullReading = { chapters: Chapter[]; unlocked: true; mode: "demo" };
