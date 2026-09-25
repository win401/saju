import { NextRequest } from "next/server";
import { unlockStoredReport } from "@/features/relationship/server/report-store";
import { checkOrigin, json, readSmallJson, SESSION_COOKIE } from "@/lib/http";
export const runtime = "nodejs";
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  // Never ship a working mock-payment bypass in a production build.
  if (process.env.NODE_ENV !== "development")
    return json(
      { error: "개발 모드에서만 체험 주문을 사용할 수 있어요." },
      403,
    );
  if (!checkOrigin(request))
    return json({ error: "허용되지 않은 요청입니다." }, 403);
  try {
    const input = await readSmallJson(request);
    if (
      typeof input !== "object" ||
      input === null ||
      !("confirmed" in input) ||
      input.confirmed !== true
    )
      return json({ error: "체험 주문 안내를 확인해주세요." }, 400);
    const { id } = await params;
    const chapters = unlockStoredReport(
      id,
      request.cookies.get(SESSION_COOKIE)?.value,
    );
    if (!chapters)
      return json(
        { error: "리포트가 만료되었어요. 입력 화면에서 다시 만들어주세요." },
        404,
      );
    return json({ chapters, unlocked: true, mode: "demo" });
  } catch {
    return json({ error: "체험 주문 요청을 확인해주세요." }, 400);
  }
}
