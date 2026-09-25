import { LunarUtil } from "lunar-typescript";
import { describe, expect, it } from "vitest";
import { analyzeChart, type TenGod } from "../src/lib/saju-analysis";
import { calculateChart } from "../src/lib/saju";
import type { BirthInput, Chart, Pillar } from "../src/types/reading";

const STEMS = [..."甲乙丙丁戊己庚辛壬癸"];
const BRANCHES = [..."子丑寅卯辰巳午未申酉戌亥"];
const GOD_NAMES: Record<string, TenGod> = {
  比肩: "비견",
  劫财: "겁재",
  食神: "식신",
  伤官: "상관",
  偏财: "편재",
  正财: "정재",
  七杀: "편관",
  正官: "정관",
  偏印: "편인",
  正印: "정인",
};
const ELEMENT_NAMES: Record<string, string> = {
  木: "목",
  火: "화",
  土: "토",
  金: "금",
  水: "수",
};

function pillar(hanja: string, label = "년주"): Pillar {
  // Deliberately misleading cached fields: facts must come from the resolved
  // Chinese characters, not the summary element count or translated labels.
  return { hanja, label, korean: "unused", elements: ["목", "목"] };
}
function fixture(day: string, patch: Partial<Chart["pillars"]> = {}): Chart {
  return {
    solarDate: "unused",
    lunarDate: "unused",
    pillars: {
      year: null,
      month: null,
      day: pillar(day, "일주"),
      hour: null,
      ...patch,
    },
    dayElement: "목",
    counts: { 목: 0, 화: 0, 토: 0, 금: 0, 수: 0 },
    warnings: [],
  };
}
const input: BirthInput = {
  nickname: "검증",
  gender: "female",
  birthDate: "2000-01-07",
  calendar: "solar",
  leapMonth: false,
  birthTime: "12:00",
  mbti: "INFP",
  location: "KR",
};
const now = new Date("2026-09-26T00:00:00Z");

describe("structural saju facts", () => {
  it.each(STEMS)(
    "matches all ten stem relations from %s against the library table",
    (dayStem) => {
      for (const stem of STEMS) {
        const analysis = analyzeChart(
          fixture(dayStem + "子", { year: pillar(stem + "子") }),
        );
        const fact = analysis.pillars.find(({ key }) => key === "year")!.stem;
        expect(fact.tenGod, dayStem + stem).toBe(
          GOD_NAMES[LunarUtil.SHI_SHEN[dayStem + stem]],
        );
        expect(fact.element).toBe(ELEMENT_NAMES[LunarUtil.WU_XING_GAN[stem]]);
        expect(fact.korean).toBe("갑을병정무기경신임계"[STEMS.indexOf(stem)]);
        expect(fact.polarity).toBe(STEMS.indexOf(stem) % 2 === 0 ? "양" : "음");
        expect(analysis.dayMaster.tenGod).toBe("비견");
      }
    },
  );

  it.each(BRANCHES)(
    "preserves every hidden stem of %s and its relative ten god",
    (branch) => {
      for (const dayStem of STEMS) {
        const analysis = analyzeChart(fixture(dayStem + branch));
        const hidden = analysis.pillars[0].hiddenStems;
        expect(hidden.map(({ hanja }) => hanja)).toEqual(
          LunarUtil.ZHI_HIDE_GAN[branch],
        );
        for (const fact of hidden) {
          expect(fact.tenGod).toBe(
            GOD_NAMES[LunarUtil.SHI_SHEN[dayStem + fact.hanja]],
          );
          expect(fact.element).toBe(
            ELEMENT_NAMES[LunarUtil.WU_XING_GAN[fact.hanja]],
          );
        }
      }
    },
  );

  it.each([
    ["子", "겨울"],
    ["丑", "계절 전환"],
    ["寅", "봄"],
    ["卯", "봄"],
    ["辰", "계절 전환"],
    ["巳", "여름"],
    ["午", "여름"],
    ["未", "계절 전환"],
    ["申", "가을"],
    ["酉", "가을"],
    ["戌", "계절 전환"],
    ["亥", "겨울"],
  ])("uses month branch %s for the seasonal category %s", (branch, name) => {
    const analysis = analyzeChart(
      fixture("甲子", { month: pillar("甲" + branch, "월주") }),
    );
    expect(analysis.season).toEqual({
      name,
      monthBranch: branch,
      monthBranchKorean: "자축인묘진사오미신유술해"[BRANCHES.indexOf(branch)],
    });
  });

  it("matches all 144 ordered branch pairings against six-combination and clash tables", () => {
    for (const [index, a] of BRANCHES.entries()) {
      for (const b of BRANCHES) {
        const analysis = analyzeChart(
          fixture("甲" + b, { year: pillar("甲" + a) }),
        );
        const kind =
          LunarUtil.HE_ZHI_6[index] === b
            ? "six-combination"
            : LunarUtil.CHONG[index] === b
              ? "clash"
              : null;
        expect(analysis.relations, a + b).toEqual(
          kind ? [{ kind, pillars: ["year", "day"], branches: [a, b] }] : [],
        );
      }
    }
  });

  it("records each distinct pillar pair once, even when branches repeat", () => {
    const analysis = analyzeChart(
      fixture("甲丑", {
        year: pillar("甲子"),
        month: pillar("丙子", "월주"),
        hour: pillar("丁丑", "시주"),
      }),
    );
    expect(analysis.relations.map(({ pillars }) => pillars)).toEqual([
      ["year", "day"],
      ["year", "hour"],
      ["month", "day"],
      ["month", "hour"],
    ]);
    expect(
      analysis.relations.every(({ kind }) => kind === "six-combination"),
    ).toBe(true);
  });

  it("does not substitute a date or reconstruct omitted pillars", () => {
    const analysis = analyzeChart(fixture("甲子"));
    expect(analysis.missingPillars).toEqual(["year", "month", "hour"]);
    expect(analysis.pillars.map(({ key }) => key)).toEqual(["day"]);
    expect(analysis.season).toBeNull();
    expect(analysis.relations).toEqual([]);
  });

  it.each(["?子", "甲?", "甲子余", ""])(
    "rejects malformed pillar %s",
    (hanja) => {
      expect(() =>
        analyzeChart(fixture("甲子", { year: pillar(hanja) })),
      ).toThrow();
    },
  );

  it("does not mutate the source chart or share editable hidden-stem arrays", () => {
    const source = fixture("甲子", { month: pillar("丁丑") });
    const before = structuredClone(source);
    const first = analyzeChart(source);
    first.pillars[0].hiddenStems.length = 0;
    expect(source).toEqual(before);
    expect(analyzeChart(source).pillars[0].hiddenStems).toHaveLength(3);
  });
});

describe("existing chart calculation policy remains authoritative", () => {
  it("describes the known 2000-01-07 chart and its two branch relationships", () => {
    const analysis = analyzeChart(calculateChart(input, now));
    expect(analysis.pillars.map(({ hanja }) => hanja)).toEqual([
      "己卯",
      "丁丑",
      "甲子",
      "庚午",
    ]);
    expect(analysis.pillars.map(({ stem }) => stem.tenGod)).toEqual([
      "정재",
      "상관",
      "비견",
      "편관",
    ]);
    expect(analysis.relations).toEqual([
      {
        kind: "six-combination",
        pillars: ["month", "day"],
        branches: ["丑", "子"],
      },
      { kind: "clash", pillars: ["day", "hour"], branches: ["子", "午"] },
    ]);
  });

  it("preserves absent year, month and hour on a time-unknown solar-term boundary", () => {
    const analysis = analyzeChart(
      calculateChart(
        { ...input, birthDate: "2024-02-04", birthTime: null },
        now,
      ),
    );
    expect(analysis.missingPillars).toEqual(["year", "month", "hour"]);
    expect(analysis.season).toBeNull();
    expect(analysis.pillars).toHaveLength(1);
  });

  it("excludes only the unknown hour on an ordinary date", () => {
    const analysis = analyzeChart(
      calculateChart({ ...input, birthTime: null }, now),
    );
    expect(analysis.missingPillars).toEqual(["hour"]);
    expect(analysis.pillars.map(({ key }) => key)).toEqual([
      "year",
      "month",
      "day",
    ]);
    expect(
      analysis.relations.some(({ pillars }) => pillars.includes("hour")),
    ).toBe(false);
  });

  it("follows the KST solar-term transition without changing the day master", () => {
    const before = analyzeChart(
      calculateChart(
        { ...input, birthDate: "2024-02-04", birthTime: "17:26" },
        now,
      ),
    );
    const after = analyzeChart(
      calculateChart(
        { ...input, birthDate: "2024-02-04", birthTime: "17:28" },
        now,
      ),
    );
    expect(before.season?.monthBranch).toBe("丑");
    expect(after.season?.monthBranch).toBe("寅");
    expect(before.dayMaster).toEqual(after.dayMaster);
  });

  it("retains the midnight day rollover even in the late Zi hour", () => {
    const late = analyzeChart(
      calculateChart({ ...input, birthTime: "23:30" }, now),
    );
    const next = analyzeChart(
      calculateChart(
        { ...input, birthDate: "2000-01-08", birthTime: "00:30" },
        now,
      ),
    );
    expect(late.dayMaster.hanja).toBe("甲");
    expect(late.pillars.find(({ key }) => key === "hour")?.stem.tenGod).toBe(
      "비견",
    );
    expect(next.dayMaster.hanja).toBe("乙");
    expect(next.pillars.find(({ key }) => key === "hour")?.stem.tenGod).toBe(
      "상관",
    );
  });
});
