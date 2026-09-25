import { describe, expect, it } from "vitest";
import { calculateChart } from "../src/lib/saju";
import { createReport } from "../src/features/relationship/server/report";
import type { BirthInput } from "../src/types/reading";

const input: BirthInput = {
  nickname: "이야기",
  gender: "female",
  birthDate: "2000-03-07",
  calendar: "solar",
  leapMonth: false,
  birthTime: "12:00",
  mbti: "INFP",
  location: "KR",
  focus: "distance",
};
function reading(patch: Partial<BirthInput> = {}) {
  const data = { ...input, ...patch };
  return createReport(data, calculateChart(data));
}

describe("narrative depth without losing personalization or provenance", () => {
  it("keeps the final guidance personal even when the selected concern is the same", () => {
    const a = reading();
    const b = reading({ birthDate: "2000-05-06" });
    const practice = (report: ReturnType<typeof reading>) =>
      report.chapters
        .at(-1)
        ?.sections?.find((s) => s.title === "내 쪽에서 바꿔볼 수 있는 한 가지")
        ?.body;
    expect(practice(a)).toBeTruthy();
    expect(practice(a)).not.toBe(practice(b));
  });

  it.each([
    { birthTime: null, mbti: null },
    { birthDate: "2024-02-04", birthTime: null, mbti: null },
    { focus: "boundary" as const },
  ])(
    "keeps the visible narrative and canonical text consistent for %j",
    (patch) => {
      const report = reading(patch);
      for (const chapter of [
        report.intro,
        report.comparison,
        ...report.chapters,
      ]) {
        expect(chapter.lead).toBeTruthy();
        expect(chapter.sections?.length).toBeGreaterThan(0);
        expect(chapter.body).toBe(
          [chapter.lead, ...chapter.sections!.map((s) => s.body)].join("\n\n"),
        );
        expect(chapter.body).not.toMatch(/undefined|null|NaN/);
        if (patch.mbti === null)
          expect(chapter.body).not.toMatch(/\b[EI][NS][TF][JP]\b/);
      }
    },
  );

  it("does not resell a free paragraph verbatim as a paid section when only the day pillar is known", () => {
    const report = reading({
      birthDate: "2024-02-04",
      birthTime: null,
      mbti: null,
    });
    const freeParagraphs = [report.intro, report.comparison]
      .flatMap((c) => c.sections!.flatMap((s) => s.body.split("\n\n")))
      .filter((p) => p.length > 80);
    const paid = report.chapters.map((c) => c.body).join("\n");
    for (const paragraph of freeParagraphs)
      expect(paid).not.toContain(paragraph);
  });

  it("records the day-root source in the exact chapters using it", () => {
    const report = reading({ focus: "boundary" });
    for (const [section, chapter] of [
      ["intro", report.intro],
      ["experiment", report.chapters.at(-1)!],
    ] as const) {
      const innerRule = report.audit.rules.find(
        (r) => r.section === section && r.id === "intimacy.day-root",
      );
      expect(innerRule).toBeDefined();
      for (const item of innerRule!.evidence)
        expect(chapter.evidence).toContainEqual(item);
    }
  });
});
