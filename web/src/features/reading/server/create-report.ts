import type { BirthInput, Chart, ReadingTheme } from "../../../types/reading";
import { createReport } from "../../relationship/server/report";
import { RULESET_VERSION } from "../../relationship/server/interpretation";
import {
  createTraditionalReport,
  TRADITIONAL_VERSION,
} from "../../traditional/server/report";
import { createMbtiReport, MBTI_VERSION } from "../../mbti/server/report";

export function reportVersion(theme: ReadingTheme = "traditional") {
  return theme === "traditional"
    ? TRADITIONAL_VERSION
    : theme === "mbti"
      ? MBTI_VERSION
      : RULESET_VERSION;
}
export function createThemedReport(input: BirthInput, chart: Chart) {
  if (input.theme === "mbti") return createMbtiReport(input, chart);
  if (input.theme === "love")
    return createReport({ ...input, mbti: null }, chart);
  return createTraditionalReport(input, chart);
}
