import { describe, expect, it } from "vitest";
import { birthSchema } from "../src/lib/birth-schema";
import { calculateChart } from "../src/lib/saju";
import { createReport } from "../src/features/relationship/server/report";
import { product } from "../src/features/relationship/product";
import type { BirthInput } from "../src/types/reading";
const base: BirthInput = {
  nickname: "테스트",
  gender: "female",
  birthDate: "2000-01-07",
  calendar: "solar",
  leapMonth: false,
  birthTime: "12:00",
  mbti: "INFP",
  location: "KR",
};
const now = new Date("2026-09-25T12:00:00Z");
const chart = (patch: Partial<BirthInput> = {}) =>
  calculateChart({ ...base, ...patch }, now);

describe("Korean calendar and declared KST rules", () => {
  it("uses the known 2000-01-07 sexagenary day anchor", () => {
    expect(chart().pillars.day.hanja).toBe("甲子");
    expect(chart().pillars.hour?.hanja).toBe("庚午");
  });
  it("converts Korean new year 2024-01-01 to Gregorian 2024-02-10", () => {
    expect(
      chart({ calendar: "lunar", birthDate: "2024-01-01" }).solarDate,
    ).toBe("2024-02-10");
  });
  it("converts the 2017 leap fifth month example from the calendar documentation", () => {
    const c = chart({ birthDate: "2017-06-24" });
    expect(c.lunarDate).toBe("2017-05-01 (윤달)");
  });
  it("distinguishes regular and leap second months in 2023", () => {
    expect(
      chart({ calendar: "lunar", birthDate: "2023-02-01", leapMonth: true })
        .solarDate,
    ).toBe("2023-03-22");
    expect(
      chart({ calendar: "lunar", birthDate: "2023-02-01" }).solarDate,
    ).toBe("2023-02-20");
  });
  it("accepts lunar February 30 independently of Gregorian date validity", () => {
    expect(
      chart({ calendar: "lunar", birthDate: "2024-02-30" }).solarDate,
    ).toBe("2024-04-08");
  });
  it("rejects an unavailable leap month", () => {
    expect(() =>
      chart({ calendar: "lunar", birthDate: "2024-02-01", leapMonth: true }),
    ).toThrow("윤달");
  });
  it("rejects an impossible solar date", () => {
    expect(() => chart({ birthDate: "2023-02-29" })).toThrow("날짜");
  });
  it("rejects future dates after lunar conversion", () => {
    expect(() => chart({ birthDate: "2027-01-01" })).toThrow("미래");
  });
  it("excludes pre-1990 historical clock regimes explicitly", () => {
    expect(() => chart({ birthDate: "1988-06-01" })).toThrow("1990");
  });
  it("applies the 2024 Lichun boundary at 17:27 KST, not 16:27", () => {
    const before = chart({ birthDate: "2024-02-04", birthTime: "17:26" });
    const after = chart({ birthDate: "2024-02-04", birthTime: "17:28" });
    expect(before.pillars.year?.hanja).toBe("癸卯");
    expect(after.pillars.year?.hanja).toBe("甲辰");
    expect(before.pillars.month?.hanja).toBe("乙丑");
    expect(after.pillars.month?.hanja).toBe("丙寅");
  });
  it("does not fabricate year/month/hour for unknown time on Lichun", () => {
    const c = chart({ birthDate: "2024-02-04", birthTime: null });
    expect(c.pillars.year).toBeNull();
    expect(c.pillars.month).toBeNull();
    expect(c.pillars.hour).toBeNull();
    expect(Object.values(c.counts).reduce((a, b) => a + b)).toBe(2);
  });
  it("counts six known characters for an ordinary unknown-time date", () => {
    const c = chart({ birthTime: null });
    expect(c.pillars.hour).toBeNull();
    expect(Object.values(c.counts).reduce((a, b) => a + b)).toBe(6);
  });
  it("uses the disclosed midnight rollover, including late Zi hour", () => {
    expect(chart({ birthTime: "23:30" }).pillars.day.hanja).toBe("甲子");
    expect(chart({ birthTime: "23:30" }).pillars.hour?.hanja).toBe("甲子");
    const next = chart({ birthDate: "2000-01-08", birthTime: "00:30" });
    expect(next.pillars.day.hanja).toBe("乙丑");
    expect(next.pillars.hour?.hanja).toBe("丙子");
  });
});
describe("validation and editorial personalization", () => {
  it.each([
    { mbti: "INVALID" },
    { gender: null },
    { gender: "INVALID" },
    { birthTime: "25:30" },
    { location: "US" },
    { leapMonth: true },
    { extra: "unexpected" },
  ])("rejects invalid input %j", (patch) =>
    expect(birthSchema.safeParse({ ...base, ...patch }).success).toBe(false),
  );
  it("keeps unknown MBTI unknown", () => {
    const r = createReport({ ...base, mbti: null }, chart());
    expect(r.comparison.body).toContain("유형 비교는 생략");
    expect(r.comparison.body).not.toContain("INFP");
    expect(r.chapters.every((chapter) => !chapter.body.includes("MBTI"))).toBe(
      true,
    );
  });
  it("changes content with the day element and selected type", () => {
    const a = createReport(base, chart());
    const b = createReport(
      { ...base, mbti: "ESTJ" },
      chart({ birthDate: "2000-01-01" }),
    );
    expect(a.intro.title).not.toEqual(b.intro.title);
    expect(a.comparison.body).not.toEqual(b.comparison.body);
    expect(a.chapters[1].question).not.toEqual(b.chapters[1].question);
  });
  it("delivers every chapter promised at the paywall", () => {
    const titles = createReport(base, chart()).chapters.map(({ title }) => title);
    expect(titles).toEqual(
      product.chapters.filter(({ free }) => !free).map(({ title }) => title),
    );
  });
});
