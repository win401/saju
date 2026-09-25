import { describe, expect, it } from "vitest";
import { calculateChart } from "../src/lib/saju";
import { createReport } from "../src/features/relationship/server/report";
import type { BirthInput } from "../src/types/reading";

const base: BirthInput = {
  nickname: "검수자",
  gender: "female",
  birthDate: "2000-01-07",
  calendar: "solar",
  leapMonth: false,
  birthTime: "12:00",
  mbti: "INFP",
  location: "KR",
};
const now = new Date("2026-09-26T00:00:00Z");

function report(patch: Partial<BirthInput> = {}) {
  const input = { ...base, ...patch };
  const chart = calculateChart(input, now);
  return { chart, content: createReport(input, chart) };
}

type Report = ReturnType<typeof createReport>;

function sections(content: Report) {
  return [content.intro, content.comparison, ...content.chapters];
}

function paidBodies(content: Report) {
  return content.chapters.map((chapter) => chapter.body);
}

function chartEvidence(content: Report) {
  return sections(content).flatMap((chapter) =>
    chapter.evidence.filter((evidence) => evidence.kind === "chart"),
  );
}

describe("relationship interpretation changes for traceable reasons", () => {
  it("uses month facts beyond an identical year, day, hour and MBTI", () => {
    const spring = report({ birthDate: "2000-03-07" });
    const summer = report({ birthDate: "2000-05-06" });

    expect(spring.chart.pillars.year).toEqual(summer.chart.pillars.year);
    expect(spring.chart.pillars.day).toEqual(summer.chart.pillars.day);
    expect(spring.chart.pillars.hour).toEqual(summer.chart.pillars.hour);
    expect(spring.chart.pillars.month?.hanja).toBe("己卯");
    expect(summer.chart.pillars.month?.hanja).toBe("辛巳");
    expect(spring.content.audit.facts.season?.name).toBe("봄");
    expect(summer.content.audit.facts.season?.name).toBe("여름");

    // Changing only a chart label or the free introduction is not deeper content.
    expect(paidBodies(spring.content)).not.toEqual(paidBodies(summer.content));
    expect(chartEvidence(spring.content)).not.toEqual(
      chartEvidence(summer.content),
    );
  });

  it("uses a known birth hour in the explanation, not only the displayed chart", () => {
    const noon = report({ birthTime: "12:00" });
    const night = report({ birthTime: "21:00" });

    expect(noon.chart.pillars.year).toEqual(night.chart.pillars.year);
    expect(noon.chart.pillars.month).toEqual(night.chart.pillars.month);
    expect(noon.chart.pillars.day).toEqual(night.chart.pillars.day);
    expect(noon.chart.pillars.hour?.hanja).toBe("庚午");
    expect(night.chart.pillars.hour?.hanja).toBe("乙亥");
    expect(paidBodies(noon.content)).not.toEqual(paidBodies(night.content));
    expect(chartEvidence(noon.content)).not.toEqual(
      chartEvidence(night.content),
    );
  });

  it("changes the final relationship exercise for a chosen concern without changing facts", () => {
    const distance = report({ focus: "distance" });
    const expression = report({ focus: "expression" });
    const boundary = report({ focus: "boundary" });
    const reports = [distance.content, expression.content, boundary.content];

    expect(distance.chart).toEqual(expression.chart);
    expect(distance.chart).toEqual(boundary.chart);
    expect(distance.content.audit.facts).toEqual(
      expression.content.audit.facts,
    );
    expect(distance.content.audit.facts).toEqual(boundary.content.audit.facts);
    expect(new Set(reports.map((r) => r.chapters.at(-1)?.body)).size).toBe(3);

    for (const content of reports) {
      expect(
        sections(content).some((chapter) =>
          chapter.evidence.some((evidence) => evidence.kind === "focus"),
        ),
      ).toBe(true);
    }
  });
});

describe("uncertainty and absent inputs stay absent", () => {
  it("does not invent an hour or derive hidden stems and relations from it", () => {
    const { content } = report({ birthTime: null });
    const facts = content.audit.facts;

    expect(facts.pillars.map((pillar) => pillar.key)).toEqual([
      "year",
      "month",
      "day",
    ]);
    expect(facts.missingPillars).toEqual(["hour"]);
    expect(
      facts.relations.every((relation) => !relation.pillars.includes("hour")),
    ).toBe(true);
    expect(facts.season).not.toBeNull();
  });

  it("excludes year, month, season and hour when birth time is unknown at Lichun", () => {
    const { content } = report({
      birthDate: "2024-02-04",
      birthTime: null,
    });
    const facts = content.audit.facts;

    expect(facts.pillars.map((pillar) => pillar.key)).toEqual(["day"]);
    expect([...facts.missingPillars].sort()).toEqual(["hour", "month", "year"]);
    expect(facts.season).toBeNull();
    expect(facts.relations).toEqual([]);
  });

  it("carries the known KST term boundary through to structured analysis", () => {
    const before = report({ birthDate: "2024-02-04", birthTime: "17:26" });
    const after = report({ birthDate: "2024-02-04", birthTime: "17:28" });
    const getPillar = (content: Report, key: "year" | "month") =>
      content.audit.facts.pillars.find((pillar) => pillar.key === key)?.hanja;

    expect(getPillar(before.content, "year")).toBe("癸卯");
    expect(getPillar(after.content, "year")).toBe("甲辰");
    expect(getPillar(before.content, "month")).toBe("乙丑");
    expect(getPillar(after.content, "month")).toBe("丙寅");
    expect(chartEvidence(before.content)).not.toEqual(
      chartEvidence(after.content),
    );
  });

  it("does not infer an MBTI type or cite MBTI evidence when none is supplied", () => {
    const { content } = report({ mbti: null });
    const fullText = sections(content)
      .map(
        (chapter) => `${chapter.title}\n${chapter.body}\n${chapter.question}`,
      )
      .join("\n");

    expect(fullText).not.toMatch(/\b[EI][SN][TF][JP]\b/);
    expect(
      sections(content).flatMap((chapter) => chapter.evidence),
    ).not.toEqual(
      expect.arrayContaining([expect.objectContaining({ kind: "mbti" })]),
    );
    expect(content.audit.rules.flatMap((rule) => rule.evidence)).not.toEqual(
      expect.arrayContaining([expect.objectContaining({ kind: "mbti" })]),
    );
    expect(content.comparison.body).toMatch(/유형 비교는 생략/);
  });

  it("does not change saju-only prose based on nickname or gender", () => {
    const original = report({ mbti: null }).content;

    for (const gender of ["male", "other", "undisclosed"] as const) {
      const changed = report({
        nickname: "다른별명",
        gender,
        mbti: null,
      }).content;
      expect(changed.audit.facts).toEqual(original.audit.facts);
      expect(sections(changed).map((chapter) => chapter.body)).toEqual(
        sections(original).map((chapter) => chapter.body),
      );
      expect(sections(changed).map((chapter) => chapter.question)).toEqual(
        sections(original).map((chapter) => chapter.question),
      );
    }
  });
});

describe("visible evidence is backed by an inspectable editorial audit", () => {
  it.each([
    { birthDate: "2000-03-07", focus: "expression" as const },
    { birthDate: "2000-05-06", focus: "boundary" as const },
    { birthDate: "2024-02-04", birthTime: null, mbti: null },
  ])("preserves evidence and applied-rule provenance for %j", (patch) => {
    const { content } = report(patch);
    expect(content.audit.status).toBe("editorial-draft");
    expect(content.audit.version.trim().length).toBeGreaterThan(0);
    expect(content.audit.rules.length).toBeGreaterThan(0);

    const auditedEvidence = content.audit.rules.flatMap((rule) => {
      expect(rule.id.trim().length).toBeGreaterThan(0);
      expect(rule.section.trim().length).toBeGreaterThan(0);
      expect(rule.condition.trim().length).toBeGreaterThan(0);
      expect(rule.evidence.length).toBeGreaterThan(0);
      return rule.evidence;
    });

    for (const chapter of sections(content)) {
      expect(chapter.evidence.length).toBeGreaterThan(0);
      for (const evidence of chapter.evidence) {
        expect(["chart", "mbti", "focus"]).toContain(evidence.kind);
        expect(evidence.label.trim().length).toBeGreaterThan(0);
        expect(evidence.detail.trim().length).toBeGreaterThan(0);
        expect(auditedEvidence).toContainEqual(evidence);
      }
    }
  });
});
