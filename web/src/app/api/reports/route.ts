import { randomUUID } from "node:crypto";
import { NextRequest } from "next/server";
import { birthSchema } from "@/lib/birth-schema";
import { calculateChart } from "@/lib/saju";
import { createStoredReport } from "@/features/relationship/server/report-store";
import { checkOrigin, json, readSmallJson, SESSION_COOKIE } from "@/lib/http";
export const runtime = "nodejs";
export async function POST(request: NextRequest) {
  if (!checkOrigin(request))
    return json({ error: "이 사이트에서 다시 요청해주세요." }, 403);
  try {
    const parsed = birthSchema.safeParse(await readSmallJson(request));
    if (!parsed.success)
      return json({ error: parsed.error.issues[0].message }, 400);
    const input = parsed.data;
    const chart = calculateChart(input);
    const owner = request.cookies.get(SESSION_COOKIE)?.value || randomUUID();
    const r = createStoredReport(owner, input, chart);
    const response = json({
      id: r.id,
      nickname: input.nickname,
      gender: input.gender,
      mbti: input.mbti,
      birthTime: input.birthTime,
      chart,
      intro: r.content.intro,
      comparison: r.content.comparison,
      demoAvailable: process.env.NODE_ENV === "development",
    });
    response.cookies.set(SESSION_COOKIE, owner, {
      httpOnly: true,
      sameSite: "strict",
      secure: request.nextUrl.protocol === "https:",
      maxAge: 3600,
      path: "/",
    });
    return response;
  } catch (error) {
    return json(
      {
        error:
          error instanceof Error ? error.message : "결과를 만들지 못했어요.",
      },
      400,
    );
  }
}
