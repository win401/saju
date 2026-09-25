import { z } from "zod";
import { GENDERS } from "../types/reading";

export const MBTI_TYPES = [
  "INTJ",
  "INTP",
  "ENTJ",
  "ENTP",
  "INFJ",
  "INFP",
  "ENFJ",
  "ENFP",
  "ISTJ",
  "ISFJ",
  "ESTJ",
  "ESFJ",
  "ISTP",
  "ISFP",
  "ESTP",
  "ESFP",
] as const;
export const birthSchema = z
  .object({
    nickname: z
      .string()
      .trim()
      .max(20, "별명은 20자 이내로 입력해주세요.")
      .default(""),
    gender: z.enum(GENDERS, {
      error: "성별을 선택해주세요. 공개하지 않기를 선택할 수도 있어요.",
    }),
    birthDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "태어난 날짜를 확인해주세요."),
    calendar: z.enum(["solar", "lunar"]),
    leapMonth: z.boolean(),
    birthTime: z
      .string()
      .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "태어난 시간을 확인해주세요.")
      .nullable(),
    mbti: z.enum(MBTI_TYPES).nullable(),
    location: z.literal("KR"),
  })
  .strict()
  .refine((v) => v.calendar === "lunar" || !v.leapMonth, {
    message: "윤달은 음력 날짜에서만 선택할 수 있어요.",
    path: ["leapMonth"],
  });
