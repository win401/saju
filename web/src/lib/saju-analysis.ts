import { ELEMENTS, type Chart, type Element } from "../types/reading";

export type PillarKey = "year" | "month" | "day" | "hour";
export type TenGod =
  | "비견"
  | "겁재"
  | "식신"
  | "상관"
  | "편재"
  | "정재"
  | "편관"
  | "정관"
  | "편인"
  | "정인";
export type StemFact = {
  hanja: string;
  korean: string;
  element: Element;
  polarity: "양" | "음";
  tenGod: TenGod;
};
export type PillarFact = {
  key: PillarKey;
  label: string;
  hanja: string;
  stem: StemFact;
  branch: string;
  hiddenStems: StemFact[];
};
export type SajuAnalysis = {
  version: string;
  dayMaster: StemFact;
  pillars: PillarFact[];
  season: {
    name: "봄" | "여름" | "가을" | "겨울" | "계절 전환";
    monthBranch: string;
    monthBranchKorean: string;
  } | null;
  relations: {
    kind: "six-combination" | "clash";
    pillars: [PillarKey, PillarKey];
    branches: [string, string];
  }[];
  missingPillars: PillarKey[];
};

const PILLAR_KEYS: PillarKey[] = ["year", "month", "day", "hour"];
const STEMS = "甲乙丙丁戊己庚辛壬癸";
const STEM_KOREAN = "갑을병정무기경신임계";
const BRANCHES = "子丑寅卯辰巳午未申酉戌亥";
const BRANCH_KOREAN = "자축인묘진사오미신유술해";

// Bounded structural tables, cross-checked against lunar-typescript 1.8.6
// LunarUtil.ZHI_HIDE_GAN / HE_ZHI_6 / CHONG. Keep source order, with no weights.
// https://github.com/6tail/lunar-typescript/blob/master/src/lib/LunarUtil.ts
const HIDDEN_STEMS: Record<string, string> = {
  子: "癸",
  丑: "己癸辛",
  寅: "甲丙戊",
  卯: "乙",
  辰: "戊乙癸",
  巳: "丙庚戊",
  午: "丁己",
  未: "己丁乙",
  申: "庚壬戊",
  酉: "辛",
  戌: "戊辛丁",
  亥: "壬甲",
};
const SIX_COMBINATIONS = ["子丑", "寅亥", "卯戌", "辰酉", "巳申", "午未"];
const CLASHES = ["子午", "丑未", "寅申", "卯酉", "辰戌", "巳亥"];

// ELEMENTS follows the generating cycle: wood → fire → earth → metal → water.
// Each row is [same polarity, different polarity], relative to the day stem.
const TEN_GODS_BY_ELEMENT_DISTANCE: [TenGod, TenGod][] = [
  ["비견", "겁재"],
  ["식신", "상관"],
  ["편재", "정재"],
  ["편관", "정관"],
  ["편인", "정인"],
];

function stemFact(hanja: string, dayStem: string): StemFact {
  const index = STEMS.indexOf(hanja);
  const dayIndex = STEMS.indexOf(dayStem);
  if (hanja.length !== 1 || dayStem.length !== 1 || index < 0 || dayIndex < 0)
    throw new Error("분석할 천간을 확인할 수 없습니다.");
  const elementIndex = Math.floor(index / 2);
  const distance = (elementIndex - Math.floor(dayIndex / 2) + 5) % 5;
  return {
    hanja,
    korean: STEM_KOREAN[index],
    element: ELEMENTS[elementIndex],
    polarity: index % 2 === 0 ? "양" : "음",
    tenGod:
      TEN_GODS_BY_ELEMENT_DISTANCE[distance][
        index % 2 === dayIndex % 2 ? 0 : 1
      ],
  };
}

function seasonFor(branch: string): NonNullable<SajuAnalysis["season"]> {
  const name = "寅卯".includes(branch)
    ? "봄"
    : "巳午".includes(branch)
      ? "여름"
      : "申酉".includes(branch)
        ? "가을"
        : "亥子".includes(branch)
          ? "겨울"
          : "계절 전환";
  return {
    name,
    monthBranch: branch,
    monthBranchKorean: BRANCH_KOREAN[BRANCHES.indexOf(branch)],
  };
}

function isPair(a: string, b: string, pairs: string[]): boolean {
  return pairs.includes(a + b) || pairs.includes(b + a);
}

/**
 * Describe only the pillars already resolved by calculateChart. Rebuilding a
 * date here would silently replace its KST / midnight / unknown-time policy.
 * These are traditional categories, not strength, compatibility or predictions.
 */
export function analyzeChart(chart: Chart): SajuAnalysis {
  const dayStem = chart.pillars.day.hanja[0];
  const dayMaster = stemFact(dayStem, dayStem);
  const pillars: PillarFact[] = [];
  const missingPillars: PillarKey[] = [];
  for (const key of PILLAR_KEYS) {
    const pillar = chart.pillars[key];
    if (!pillar) {
      missingPillars.push(key);
      continue;
    }
    const branch = pillar.hanja[1];
    if (pillar.hanja.length !== 2 || !BRANCHES.includes(branch))
      throw new Error("분석할 지지를 확인할 수 없습니다.");
    pillars.push({
      key,
      label: pillar.label,
      hanja: pillar.hanja,
      stem: stemFact(pillar.hanja[0], dayStem),
      branch,
      hiddenStems: [...HIDDEN_STEMS[branch]].map((stem) =>
        stemFact(stem, dayStem),
      ),
    });
  }

  const relations: SajuAnalysis["relations"] = [];
  for (let i = 0; i < pillars.length; i++) {
    for (let j = i + 1; j < pillars.length; j++) {
      const a = pillars[i];
      const b = pillars[j];
      const kind = isPair(a.branch, b.branch, SIX_COMBINATIONS)
        ? "six-combination"
        : isPair(a.branch, b.branch, CLASHES)
          ? "clash"
          : null;
      if (kind)
        relations.push({
          kind,
          pillars: [a.key, b.key],
          branches: [a.branch, b.branch],
        });
    }
  }

  const month = pillars.find((pillar) => pillar.key === "month");
  return {
    version: "saju-facts-v1",
    dayMaster,
    pillars,
    season: month ? seasonFor(month.branch) : null,
    relations,
    missingPillars,
  };
}
