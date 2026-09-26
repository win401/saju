import { z } from "zod";

export const LOVE_STATUSES = [
  "single",
  "talking",
  "dating",
  "complicated",
] as const;
export const LOVE_STATUS_LABELS: Record<
  (typeof LOVE_STATUSES)[number],
  string
> = {
  single: "새로운 인연을 기다려요",
  talking: "마음에 둔 사람이 있어요",
  dating: "연애 중이에요",
  complicated: "관계를 정리하거나 고민 중이에요",
};
export const loveSituationSchema = z
  .object({
    status: z.enum(LOVE_STATUSES),
    question: z
      .string()
      .trim()
      .min(8, "궁금한 상황을 8자 이상 알려주세요.")
      .max(500),
  })
  .strict();
export type LoveSituation = z.infer<typeof loveSituationSchema>;

// The provider schema is deliberately simple; bounded validation follows on the server.
export const aiLoveWireSchema = z
  .object({
    title: z.string(),
    opening: z.string(),
    sections: z.array(
      z
        .object({
          title: z.string(),
          paragraphs: z.array(z.string()),
          evidenceIds: z.array(z.string()),
        })
        .strict(),
    ),
    takeaway: z.string(),
    nextQuestion: z.string(),
  })
  .strict();
const prose = (max: number) => z.string().trim().min(1).max(max);
export const aiLoveReadingSchema = z
  .object({
    title: prose(100),
    opening: prose(1200),
    sections: z
      .array(
        z
          .object({
            title: prose(100),
            paragraphs: z.array(prose(1600)).min(1).max(3),
            evidenceIds: z.array(prose(80)).max(5),
          })
          .strict(),
      )
      .min(3)
      .max(5),
    takeaway: prose(600),
    nextQuestion: prose(200),
  })
  .strict();
export type AiLoveReading = z.infer<typeof aiLoveReadingSchema>;
export type AiLoveEvidence = { id: string; label: string; detail: string };
export type LoveConsultationResponse = {
  source: "openai";
  reading: AiLoveReading;
  evidence: AiLoveEvidence[];
  limitation: string;
};
export type LoveAiAvailability = {
  available: boolean;
  requiresAccessCode: boolean;
};
