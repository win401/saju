import { NextRequest } from "next/server";
import {
  deleteStoredReport,
  getStoredReport,
} from "@/features/reading/server/report-store";
import { checkOrigin, json, SESSION_COOKIE } from "@/lib/http";
export const runtime = "nodejs";
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!checkOrigin(request))
    return json({ error: "허용되지 않은 요청입니다." }, 403);
  const { id } = await params;
  const owner = request.cookies.get(SESSION_COOKIE)?.value;
  if (!getStoredReport(id, owner))
    return json({ error: "리포트가 없거나 만료되었습니다." }, 404);
  deleteStoredReport(id, owner);
  return json({ deleted: true });
}
