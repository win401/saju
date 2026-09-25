import { afterEach, expect, it, vi } from "vitest";
import {
  createStoredReport,
  deleteStoredReport,
  getStoredReport,
  unlockStoredReport,
} from "../src/features/relationship/server/report-store";
import { calculateChart } from "../src/lib/saju";
import type { BirthInput } from "../src/types/reading";
const input: BirthInput = {
  nickname: "",
  gender: "undisclosed",
  birthDate: "2000-01-07",
  calendar: "solar",
  leapMonth: false,
  birthTime: null,
  mbti: null,
  location: "KR",
};
const chart = calculateChart(input);
afterEach(() => vi.useRealTimers());
it("protects reports by owner, permits idempotent unlock, and deletes explicitly", () => {
  const r = createStoredReport("owner-a", input, chart);
  expect(getStoredReport(r.id, "owner-b")).toBeNull();
  expect(unlockStoredReport(r.id, "owner-b")).toBeNull();
  const chapters = unlockStoredReport(r.id, "owner-a");
  expect(chapters).toHaveLength(4);
  expect(unlockStoredReport(r.id, "owner-a")).toEqual(chapters);
  deleteStoredReport(r.id, "owner-b");
  expect(getStoredReport(r.id, "owner-a")).not.toBeNull();
  deleteStoredReport(r.id, "owner-a");
  expect(getStoredReport(r.id, "owner-a")).toBeNull();
});
it("expires report access after one hour", () => {
  vi.useFakeTimers();
  const r = createStoredReport("expire", input, chart);
  vi.advanceTimersByTime(3600001);
  expect(getStoredReport(r.id, "expire")).toBeNull();
});
it("replaces the previous report for the same session", () => {
  const a = createStoredReport("same", input, chart);
  createStoredReport("same", input, chart);
  expect(getStoredReport(a.id, "same")).toBeNull();
});
it("requires regeneration after the stored interpretation version changes", () => {
  const r = createStoredReport("old-rules", input, chart);
  r.content.audit.version = "obsolete";
  expect(getStoredReport(r.id, "old-rules")).toBeNull();
  expect(unlockStoredReport(r.id, "old-rules")).toBeNull();
});
