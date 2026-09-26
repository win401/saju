import { NextRequest } from "next/server";
import { z } from "zod";
import { birthSchema } from "@/lib/birth-schema";
import { calculateChart } from "@/lib/saju";
import { checkOrigin, json, readSmallJson } from "@/lib/http";
import { loveSituationSchema } from "@/features/relationship/ai-contract";
import {
  aiLimiter,
  loveAiAvailability,
  validAiAccessCode,
} from "@/features/relationship/server/ai-access";
import {
  AiLoveError,
  generateLoveConsultation,
} from "@/features/relationship/server/ai-love";

export const runtime = "nodejs";
export const maxDuration = 60;

const requestSchema = z
  .object({
    input: birthSchema.refine((value) => value.theme === "love"),
    situation: loveSituationSchema,
    consent: z.literal(true),
    accessCode: z.string().max(256).optional(),
  })
  .strict();

export async function GET() {
  return json(loveAiAvailability());
}

export async function POST(request: NextRequest) {
  if (!checkOrigin(request))
    return json({ error: "이 사이트에서 다시 요청해주세요." }, 403);
  if (!loveAiAvailability().available)
    return json(
      {
        error:
          "여울의 AI 상담을 준비하고 있어요. 기본 사주 해설은 계속 읽을 수 있어요.",
      },
      503,
    );

  let parsed: z.infer<typeof requestSchema>;
  try {
    const validated = requestSchema.safeParse(await readSmallJson(request));
    if (!validated.success)
      return json(
        { error: "연애 상태, 질문과 AI 상담 동의를 확인해주세요." },
        400,
      );
    parsed = validated.data;
    // Resolve invalid calendar dates before spending an API request.
    calculateChart(parsed.input);
  } catch {
    return json({ error: "입력한 출생정보와 요청 형식을 확인해주세요." }, 400);
  }

  if (!validAiAccessCode(parsed.accessCode))
    return json({ error: "체험 코드를 확인해주세요." }, 403);
  const release = aiLimiter.acquire();
  if (!release) {
    const response = json(
      { error: "지금은 상담 요청이 많아요. 잠시 후 다시 시도해주세요." },
      429,
    );
    response.headers.set("Retry-After", "600");
    return response;
  }
  try {
    return json(await generateLoveConsultation(parsed.input, parsed.situation));
  } catch (error) {
    if (error instanceof AiLoveError && error.code === "quota_exceeded")
      return json(
        {
          error:
            "AI 상담 사용 한도에 도달했어요. 운영자가 사용 설정을 확인한 뒤 다시 이용할 수 있어요.",
          code: "quota_exceeded",
        },
        503,
      );
    if (error instanceof AiLoveError && error.code === "invalid_credentials")
      return json(
        {
          error:
            "AI 상담 연결 설정을 확인하고 있어요. 기본 해설은 계속 읽을 수 있어요.",
          code: "invalid_credentials",
        },
        503,
      );
    if (error instanceof AiLoveError && error.code === "rate_limit")
      return json(
        {
          error: "AI 상담이 잠시 붐비고 있어요. 잠시 후 다시 시도해주세요.",
          code: "rate_limit",
        },
        429,
      );
    if (error instanceof AiLoveError && error.code === "timeout")
      return json(
        {
          error:
            "답변을 만드는 데 시간이 걸리고 있어요. 잠시 후 다시 요청해주세요.",
        },
        504,
      );
    // Never send provider errors, raw prompts, access codes, or credentials.
    return json(
      {
        error:
          "지금은 AI 답변을 완성하지 못했어요. 입력을 유지했으니 잠시 후 다시 시도해주세요.",
      },
      502,
    );
  } finally {
    release();
  }
}
