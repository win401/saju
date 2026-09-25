import { describe, expect, it } from "vitest";
import { birthSchema, MBTI_TYPES } from "../src/lib/birth-schema";
import { calculateChart } from "../src/lib/saju";
import {
  createThemedReport,
  reportVersion,
} from "../src/features/reading/server/create-report";
import { READING_PRODUCTS } from "../src/features/reading/catalog";
import { READING_THEMES, type BirthInput } from "../src/types/reading";

const input: BirthInput = {
  nickname: "기본",
  gender: "female",
  birthDate: "2000-03-07",
  calendar: "solar",
  leapMonth: false,
  birthTime: "12:00",
  mbti: "INFP",
  location: "KR",
  focus: "boundary",
};
function report(patch: Partial<BirthInput> = {}) {
  const data = birthSchema.parse({ ...input, ...patch });
  return createThemedReport(data, calculateChart(data));
}

describe("independent product contracts", () => {
  it("defaults to traditional and removes information irrelevant to each product", () => {
    expect(birthSchema.parse(input)).toMatchObject({
      theme: "traditional",
      mbti: null,
      focus: null,
    });
    expect(birthSchema.parse({ ...input, theme: "love" })).toMatchObject({
      mbti: null,
      focus: "boundary",
    });
    expect(birthSchema.parse({ ...input, theme: "mbti" })).toMatchObject({
      mbti: "INFP",
      focus: null,
    });
    expect(
      birthSchema.safeParse({ ...input, theme: "mbti", mbti: null }).success,
    ).toBe(false);
    expect(birthSchema.safeParse({ ...input, theme: "unknown" }).success).toBe(
      false,
    );
  });

  it.each(READING_THEMES)(
    "delivers the exact paid contents promised for %s",
    (theme) => {
      const content = report({ theme });
      expect(content.chapters.map((c) => c.title)).toEqual(
        READING_PRODUCTS[theme].chapters
          .filter((c) => !c.free)
          .map((c) => c.title),
      );
      expect(content.audit.version).toBe(reportVersion(theme));
      const evidence = content.audit.rules.flatMap((rule) => rule.evidence);
      for (const chapter of [
        content.intro,
        content.comparison,
        ...content.chapters,
      ]) {
        expect(chapter.body).toBe(
          [chapter.lead, ...chapter.sections!.map((s) => s.body)].join("\n\n"),
        );
        expect(chapter.body).not.toMatch(/undefined|NaN/);
        for (const item of chapter.evidence)
          expect(evidence).toContainEqual(item);
      }
    },
  );

  it("uses independently composed chapter content rather than just retitling the same report", () => {
    const reports = READING_THEMES.map((theme) => report({ theme }));
    for (let i = 0; i < 4; i++)
      expect(new Set(reports.map((r) => r.chapters[i].body)).size).toBe(3);
  });

  it("keeps traditional reading independent of MBTI, selected romance scene and gender", () => {
    const a = report({ theme: "traditional" });
    const b = report({
      theme: "traditional",
      mbti: "ESTJ",
      focus: "distance",
      gender: "male",
      nickname: "다른 이름",
    });
    expect(a).toEqual(b);
    const all = [a.intro, a.comparison, ...a.chapters];
    expect(
      all.flatMap((c) => c.evidence).every((e) => e.kind === "chart"),
    ).toBe(true);
    expect(all.map((c) => c.body).join("\n")).not.toMatch(
      /\b[EI][SN][TF][JP]\b/,
    );
  });

  it("traditional paid interpretation changes when month changes with the same day pillar", () => {
    const a = report({ theme: "traditional", birthDate: "2000-03-07" });
    const b = report({ theme: "traditional", birthDate: "2000-05-06" });
    expect(a.audit.facts.dayMaster).toEqual(b.audit.facts.dayMaster);
    expect(a.chapters.map((c) => c.body)).not.toEqual(
      b.chapters.map((c) => c.body),
    );
  });

  it.each(READING_THEMES)(
    "never invents missing pillars at a term boundary for %s",
    (theme) => {
      const content = report({
        theme,
        birthDate: "2024-02-04",
        birthTime: null,
      });
      expect(content.audit.facts.pillars.map((p) => p.key)).toEqual(["day"]);
      expect(content.audit.facts.season).toBeNull();
      expect(content.audit.facts.relations).toEqual([]);
      expect(content.chapters.map((c) => c.body).join("\n")).not.toMatch(
        /undefined|NaN/,
      );
      if (theme === "traditional") {
        expect(content.chapters[0].body).toContain("같은 일지의");
        expect(content.chapters[0].body).not.toContain("두 자리");
      }
      if (theme === "mbti") {
        expect(content.comparison.body).toContain("같은 일지 단서");
        expect(content.comparison.body).not.toContain("두 자리");
      }
    },
  );

  it("all sixteen self-reported MBTI choices retain distinct detailed readings", () => {
    const bodies = MBTI_TYPES.map((mbti) =>
      report({ theme: "mbti", mbti })
        .chapters.map((c) => c.body)
        .join("\n"),
    );
    expect(new Set(bodies).size).toBe(16);
  });
});
