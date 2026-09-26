import "server-only";
import OpenAI, { APIConnectionTimeoutError, APIError } from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import type { BirthInput } from "@/types/reading";
import {
  aiLoveReadingSchema,
  aiLoveWireSchema,
  type LoveConsultationResponse,
  type LoveSituation,
} from "../ai-contract";
import {
  buildLoveAiContext,
  LOVE_AI_INSTRUCTIONS,
  LOVE_AI_LIMITATION,
} from "./ai-love-prompt";

type AiLoveErrorCode =
  | "unavailable"
  | "timeout"
  | "invalid_output"
  | "provider_error"
  | "quota_exceeded"
  | "invalid_credentials"
  | "rate_limit";
const SAFE_MESSAGES: Record<AiLoveErrorCode, string> = {
  unavailable:
    "AI 상담 연결을 준비하고 있어요. 기본 연애 리포트는 그대로 볼 수 있어요.",
  timeout:
    "상담을 정리하는 데 시간이 오래 걸리고 있어요. 잠시 후 다시 시도해주세요.",
  invalid_output: "상담 내용을 확인하지 못했어요. 잠시 후 다시 시도해주세요.",
  provider_error:
    "지금은 AI 상담을 연결하기 어려워요. 잠시 후 다시 시도해주세요.",
  quota_exceeded:
    "AI 상담의 사용량 한도에 도달했어요. 기본 연애 리포트는 그대로 볼 수 있어요.",
  invalid_credentials:
    "AI 상담 연결 설정을 확인 중이에요. 기본 연애 리포트는 그대로 볼 수 있어요.",
  rate_limit: "AI 상담 요청이 잠시 몰리고 있어요. 조금 뒤 다시 시도해주세요.",
};
const QUOTA_ERROR_CODES = new Set([
  "insufficient_quota",
  "credit_balance_exhausted",
  "organization_spend_limit_exceeded",
  "project_spend_limit_exceeded",
  "organization_usage_limit_exceeded",
]);

export class AiLoveError extends Error {
  constructor(public readonly code: AiLoveErrorCode) {
    super(SAFE_MESSAGES[code]);
    this.name = "AiLoveError";
  }
}

export async function generateLoveConsultation(
  input: BirthInput,
  situation: LoveSituation,
): Promise<LoveConsultationResponse> {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) throw new AiLoveError("unavailable");
  const { payload, evidence } = buildLoveAiContext(input, situation);
  const model = process.env.OPENAI_MODEL?.trim() || "gpt-6-sol";

  try {
    const client = new OpenAI({
      apiKey,
      baseURL: "https://api.openai.com/v1",
      timeout: 45_000,
      maxRetries: 0,
      // Override OPENAI_LOG so the SDK cannot log consultation inputs or responses.
      logLevel: "off",
    });
    const response = await client.responses.parse({
      model,
      // Other model overrides use their own defaults; none is verified for Sol.
      ...(model === "gpt-6-sol" || model.startsWith("gpt-6-sol-")
        ? { reasoning: { effort: "none" as const } }
        : {}),
      store: false,
      max_output_tokens: 6_000,
      instructions: LOVE_AI_INSTRUCTIONS,
      input: [{ role: "user", content: JSON.stringify(payload) }],
      text: { format: zodTextFormat(aiLoveWireSchema, "love_consultation") },
    });

    const refused = response.output.some(
      (item) =>
        item.type === "message" &&
        item.content.some((part) => part.type === "refusal"),
    );
    if (response.status !== "completed" || refused)
      throw new AiLoveError("invalid_output");
    const validated = aiLoveReadingSchema.safeParse(response.output_parsed);
    if (!validated.success) throw new AiLoveError("invalid_output");
    const reading = validated.data;
    const allowed = new Set(evidence.map((fact) => fact.id));
    const used = new Set(
      reading.sections.flatMap((section) => section.evidenceIds),
    );
    const supportedSections = reading.sections.filter(
      (section) => section.evidenceIds.length > 0,
    );
    // References establish provenance, not semantic truth; editorial review is still required.
    if (
      used.size < 2 ||
      supportedSections.length < 2 ||
      [...used].some((id) => !allowed.has(id)) ||
      reading.sections.some(
        (section) =>
          new Set(section.evidenceIds).size !== section.evidenceIds.length,
      ) ||
      JSON.stringify(reading).length > 9_000
    )
      throw new AiLoveError("invalid_output");

    return {
      source: "openai",
      reading,
      evidence: evidence.filter((fact) => used.has(fact.id)),
      limitation: LOVE_AI_LIMITATION,
    };
  } catch (error) {
    if (error instanceof AiLoveError) throw error;
    if (error instanceof APIConnectionTimeoutError)
      throw new AiLoveError("timeout");
    if (error instanceof APIError) {
      if (error.status === 401 || error.status === 403)
        throw new AiLoveError("invalid_credentials");
      if (error.status === 429)
        throw new AiLoveError(
          error.code && QUOTA_ERROR_CODES.has(error.code)
            ? "quota_exceeded"
            : "rate_limit",
        );
    }
    // parse() can reject malformed JSON before output_parsed reaches our validator.
    if (
      error instanceof SyntaxError ||
      (error instanceof Error && error.name === "ZodError")
    )
      throw new AiLoveError("invalid_output");
    // Never attach cause, log the provider error, or expose its message/request input.
    throw new AiLoveError("provider_error");
  }
}
