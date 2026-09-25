import KoreanLunarCalendar from "korean-lunar-calendar";
import { Solar } from "lunar-typescript";
import {
  ELEMENTS,
  type BirthInput,
  type Chart,
  type Element,
  type Pillar,
} from "../types/reading";

const STEMS = "甲乙丙丁戊己庚辛壬癸";
const BRANCHES = "子丑寅卯辰巳午未申酉戌亥";
const KOREAN: Record<string, string> = Object.fromEntries(
  [...(STEMS + BRANCHES)].map((char, index) => [
    char,
    [..."갑을병정무기경신임계자축인묘진사오미신유술해"][index],
  ]),
);
const STEM_ELEMENTS: Element[] = [
  "목",
  "목",
  "화",
  "화",
  "토",
  "토",
  "금",
  "금",
  "수",
  "수",
];
const BRANCH_ELEMENTS: Element[] = [
  "수",
  "토",
  "목",
  "목",
  "토",
  "화",
  "화",
  "토",
  "금",
  "금",
  "토",
  "수",
];
const dateString = (year: number, month: number, day: number) =>
  `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

function pillar(label: string, hanja: string): Pillar {
  const stem = STEMS.indexOf(hanja[0]);
  const branch = BRANCHES.indexOf(hanja[1]);
  if (stem < 0 || branch < 0)
    throw new Error("간지 계산 결과를 확인할 수 없습니다.");
  return {
    label,
    hanja,
    korean: [...hanja].map((c) => KOREAN[c]).join(""),
    elements: [STEM_ELEMENTS[stem], BRANCH_ELEMENTS[branch]],
  };
}

// lunar-typescript's astronomical terms are expressed in UTC+8.
// Translate the same instant from a KST clock to that clock for YEAR/MONTH only.
// Day boundaries and hour branches remain on the explicitly selected KST clock.
function termCalendar(y: number, m: number, d: number, h: number, min: number) {
  const utc8 = new Date(Date.UTC(y, m - 1, d, h - 1, min));
  return Solar.fromYmdHms(
    utc8.getUTCFullYear(),
    utc8.getUTCMonth() + 1,
    utc8.getUTCDate(),
    utc8.getUTCHours(),
    utc8.getUTCMinutes(),
    0,
  ).getLunar();
}

export function calculateChart(input: BirthInput, now = new Date()): Chart {
  const [year, month, day] = input.birthDate.split("-").map(Number);
  if (year < 1990 || year > 2050)
    throw new Error("현재 체험은 1990년 이후 한국 출생 날짜를 지원해요.");
  const korean = new KoreanLunarCalendar();
  const valid =
    input.calendar === "lunar"
      ? korean.setLunarDate(year, month, day, input.leapMonth)
      : korean.setSolarDate(year, month, day);
  if (!valid)
    throw new Error(
      "존재하지 않는 날짜이거나 윤달 선택이 맞지 않아요. 날짜를 다시 확인해주세요.",
    );
  const solar = korean.getSolarCalendar();
  const lunar = korean.getLunarCalendar();
  const solarDate = dateString(solar.year, solar.month, solar.day);
  const todayKst = new Date(now.getTime() + 9 * 3600000)
    .toISOString()
    .slice(0, 10);
  if (solarDate > todayKst)
    throw new Error("미래의 출생일은 입력할 수 없어요.");
  if (solarDate < "1990-01-01")
    throw new Error("현재 체험은 양력 1990년 이후 출생 날짜를 지원해요.");
  const [hour, minute] = (input.birthTime ?? "12:00").split(":").map(Number);
  const terms = termCalendar(solar.year, solar.month, solar.day, hour, minute);
  let yearPillar: Pillar | null = pillar("년주", terms.getYearInGanZhiExact());
  let monthPillar: Pillar | null = pillar(
    "월주",
    terms.getMonthInGanZhiExact(),
  );
  // Korean calendar independently provides the civil-day cycle at midnight.
  const dayPillar = pillar("일주", korean.getChineseGapja().day.slice(0, 2));
  const warnings: string[] = [];
  let hourPillar: Pillar | null = null;
  if (input.birthTime === null) {
    warnings.push(
      "출생시간을 몰라 시주는 제외했어요. 오행도 확인된 글자만 집계합니다.",
    );
    const start = termCalendar(solar.year, solar.month, solar.day, 0, 0);
    const end = termCalendar(solar.year, solar.month, solar.day, 23, 59);
    if (start.getYearInGanZhiExact() !== end.getYearInGanZhiExact())
      yearPillar = null;
    if (start.getMonthInGanZhiExact() !== end.getMonthInGanZhiExact())
      monthPillar = null;
    if (!yearPillar || !monthPillar)
      warnings.push(
        "이 날은 절기가 바뀌는 날이에요. 시간을 알기 전에는 년주 또는 월주를 확정하지 않습니다.",
      );
  } else {
    const branchIndex = Math.floor((hour + 1) / 2) % 12;
    const dayStem = STEMS.indexOf(dayPillar.hanja[0]);
    const hourStem = ((dayStem % 5) * 2 + branchIndex) % 10;
    hourPillar = pillar("시주", STEMS[hourStem] + BRANCHES[branchIndex]);
  }
  const pillars = {
    year: yearPillar,
    month: monthPillar,
    day: dayPillar,
    hour: hourPillar,
  };
  const counts = Object.fromEntries(ELEMENTS.map((el) => [el, 0])) as Record<
    Element,
    number
  >;
  for (const p of Object.values(pillars)) {
    if (p) for (const el of p.elements) counts[el]++;
  }
  return {
    solarDate,
    lunarDate: `${dateString(lunar.year, lunar.month, lunar.day)}${lunar.intercalation ? " (윤달)" : ""}`,
    pillars,
    dayElement: dayPillar.elements[0],
    counts,
    warnings,
  };
}
