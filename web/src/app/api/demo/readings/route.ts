import { NextRequest } from "next/server";
import { z } from "zod";
import { birthSchema } from "@/lib/birth-schema";
import { isPublicDemoEnabled } from "@/lib/deployment-mode";
import { checkOrigin, json, readSmallJson } from "@/lib/http";
import { calculateChart } from "@/lib/saju";
import { createThemedReport } from "@/features/reading/server/create-report";

export const runtime = "nodejs";

const demoSchema = z
  .object({ confirmed: z.literal(true), input: birthSchema })
  .strict();

export async function POST(request: NextRequest) {
  if (!isPublicDemoEnabled())
    return json({ error: "공개 체험이 활성화되어 있지 않아요." }, 403);
  if (!checkOrigin(request))
    return json({ error: "이 사이트에서 다시 요청해주세요." }, 403);

  try {
    const parsed = demoSchema.safeParse(await readSmallJson(request));
    if (!parsed.success)
      return json({ error: "체험 안내와 입력 내용을 확인해주세요." }, 400);

    // Public demo content is free. Recompute from validated input so the request
    // is independent of any previous request or server instance.
    const input = parsed.data.input;
    const chart = calculateChart(input);
    const report = createThemedReport(input, chart);
    return json({ chapters: report.chapters, unlocked: true, mode: "demo" });
  } catch (error) {
    return json(
      {
        error:
          error instanceof Error ? error.message : "리포트를 만들지 못했어요.",
      },
      400,
    );
  }
}
