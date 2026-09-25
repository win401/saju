import { randomUUID } from "node:crypto";
import type { BirthInput, Chart, Chapter } from "../../../types/reading";
import { createThemedReport, reportVersion } from "./create-report";

type StoredReport = {
  id: string;
  owner: string;
  input: BirthInput;
  chart: Chart;
  content: ReturnType<typeof createThemedReport>;
  createdAt: number;
  unlocked: boolean;
};
const TTL = 60 * 60 * 1000;
const globalStore = globalThis as typeof globalThis & {
  __gyeolReports?: Map<string, StoredReport>;
};
const reports = (globalStore.__gyeolReports ??= new Map());
function purge(now = Date.now()) {
  for (const [id, r] of reports)
    if (now - r.createdAt >= TTL) reports.delete(id);
}
export function createStoredReport(
  owner: string,
  input: BirthInput,
  chart: Chart,
) {
  purge();
  // Limit memory and keep at most one report per browser session.
  for (const [id, r] of reports) if (r.owner === owner) reports.delete(id);
  if (reports.size >= 500)
    throw new Error("체험 요청이 많아요. 잠시 후 다시 시도해주세요.");
  const report: StoredReport = {
    id: randomUUID(),
    owner,
    input,
    chart,
    content: createThemedReport(input, chart),
    createdAt: Date.now(),
    unlocked: false,
  };
  reports.set(report.id, report);
  const expiration = setTimeout(() => reports.delete(report.id), TTL);
  expiration.unref();
  return report;
}
export function getStoredReport(id: string, owner: string | undefined) {
  purge();
  const r = reports.get(id);
  if (r && r.content.audit?.version !== reportVersion(r.input.theme)) {
    reports.delete(id);
    return null;
  }
  return r && r.owner === owner ? r : null;
}
export function deleteStoredReport(id: string, owner: string | undefined) {
  if (getStoredReport(id, owner)) reports.delete(id);
}
export function unlockStoredReport(
  id: string,
  owner: string | undefined,
): Chapter[] | null {
  const r = getStoredReport(id, owner);
  if (!r) return null;
  r.unlocked = true;
  return r.content.chapters;
}
