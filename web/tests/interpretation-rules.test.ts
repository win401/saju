import { describe, expect, it } from "vitest";
import { buildRelationshipPlan } from "../src/features/relationship/server/interpretation";
import { calculateChart } from "../src/lib/saju";
import type { BirthInput } from "../src/types/reading";

const base: BirthInput = {
  nickname: "검수",
  gender: "undisclosed",
  birthDate: "2023-09-17",
  calendar: "solar",
  leapMonth: false,
  birthTime: "22:00",
  mbti: null,
  location: "KR",
};
const now = new Date("2026-09-26T00:00:00Z");

// Date fixtures keep stem/branch parity, hour stems, translated labels and
// element counts consistent. Explicit branch expectations document each case.
function plan(patch: Partial<BirthInput> = {}) {
  return buildRelationshipPlan(calculateChart({ ...base, ...patch }, now));
}
function branches(result: ReturnType<typeof plan>) {
  return result.facts.pillars.map(({ branch }) => branch);
}
function relationEvidence(result: ReturnType<typeof plan>, label: string) {
  return result.boundary.evidence.find((evidence) => evidence.label === label);
}

describe("boundary rules preserve both kinds of known branch relationship", () => {
  it("keeps a non-day clash when the day branch has a combination", () => {
    const result = plan();
    expect(branches(result)).toEqual(["卯", "酉", "寅", "亥"]);
    expect(result.boundary.ruleId).toBe("boundary.mixed");
    expect(relationEvidence(result, "지지의 육합")?.detail).toContain(
      "일주 寅 · 시주 亥",
    );
    expect(relationEvidence(result, "지지의 충")?.detail).toContain(
      "년주 卯 · 월주 酉",
    );
  });

  it("keeps a non-day combination when the day branch has a clash", () => {
    const result = plan({ birthDate: "2023-10-21", birthTime: "12:00" });
    expect(branches(result)).toEqual(["卯", "戌", "子", "午"]);
    expect(result.boundary.ruleId).toBe("boundary.mixed");
    expect(relationEvidence(result, "지지의 육합")?.detail).toContain(
      "년주 卯 · 월주 戌",
    );
    expect(relationEvidence(result, "지지의 충")?.detail).toContain(
      "일주 子 · 시주 午",
    );
  });

  it("prefers a day-related pair independently for each relationship kind", () => {
    const result = plan({ birthDate: "1997-01-22", birthTime: "12:00" });
    expect(branches(result)).toEqual(["子", "丑", "子", "午"]);
    expect(result.facts.relations).toHaveLength(4);
    expect(result.boundary.ruleId).toBe("boundary.mixed");
    expect(relationEvidence(result, "지지의 육합")?.detail).toContain(
      "월주 丑 · 일주 子",
    );
    expect(relationEvidence(result, "지지의 충")?.detail).toContain(
      "일주 子 · 시주 午",
    );
  });

  it("falls back to a disclosed day hidden stem when no known pair qualifies", () => {
    const result = plan({ birthDate: "2020-02-18", birthTime: "10:00" });
    expect(branches(result)).toEqual(["子", "寅", "卯", "巳"]);
    expect(result.facts.relations).toEqual([]);
    expect(result.boundary.ruleId).toBe("boundary.day-root");
    expect(result.boundary.evidence).toHaveLength(1);
    expect(result.boundary.evidence[0].label).toBe("일주 지장간");
    expect(result.boundary.evidence[0].detail).toContain("乙(을)·편재");
    expect(relationEvidence(result, "지지의 육합")).toBeUndefined();
    expect(relationEvidence(result, "지지의 충")).toBeUndefined();
  });
});

describe("missing facts cannot enter boundary selection", () => {
  it("does not reconstruct the omitted hour's combination from a known-time fixture", () => {
    const result = plan({ birthTime: null });
    expect(branches(result)).toEqual(["卯", "酉", "寅"]);
    expect(result.facts.missingPillars).toEqual(["hour"]);
    expect(result.boundary.ruleId).toBe("boundary.clash");
    expect(relationEvidence(result, "지지의 충")?.detail).toContain(
      "년주 卯 · 월주 酉",
    );
    expect(relationEvidence(result, "지지의 육합")).toBeUndefined();
    expect(JSON.stringify(result.boundary)).not.toContain("시주");
  });

  it("does not reconstruct the omitted hour's clash from a known-time fixture", () => {
    const result = plan({ birthDate: "2023-10-21", birthTime: null });
    expect(branches(result)).toEqual(["卯", "戌", "子"]);
    expect(result.boundary.ruleId).toBe("boundary.combination");
    expect(relationEvidence(result, "지지의 육합")?.detail).toContain(
      "년주 卯 · 월주 戌",
    );
    expect(relationEvidence(result, "지지의 충")).toBeUndefined();
    expect(JSON.stringify(result.boundary)).not.toContain("시주");
  });

  it("uses only the day fallback when the term boundary leaves three pillars unknown", () => {
    const result = plan({ birthDate: "2024-02-04", birthTime: null });
    expect(result.facts.missingPillars).toEqual(["year", "month", "hour"]);
    expect(result.facts.pillars.map(({ key }) => key)).toEqual(["day"]);
    expect(result.boundary.ruleId).toBe("boundary.day-root");
    expect(result.boundary.evidence[0].label).toBe("일주 지장간");
    expect(JSON.stringify(result.boundary)).not.toMatch(/년주|월주|시주/);
    expect(relationEvidence(result, "지지의 육합")).toBeUndefined();
    expect(relationEvidence(result, "지지의 충")).toBeUndefined();
  });
});
