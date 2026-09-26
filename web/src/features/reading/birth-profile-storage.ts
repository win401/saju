import { z } from "zod";
import { MBTI_TYPES } from "../../lib/birth-schema";
import { GENDERS, type BirthInput } from "../../types/reading";

export const BIRTH_PROFILE_STORAGE_KEY = "gyeol.birth-profile.v1";
export const BIRTH_PROFILE_TTL_MS = 24 * 60 * 60 * 1000;

export type StoredBirthProfile = {
  version: 1;
  savedAt: number;
  expiresAt: number;
  profile: Pick<
    BirthInput,
    | "nickname"
    | "gender"
    | "birthDate"
    | "calendar"
    | "leapMonth"
    | "birthTime"
    | "mbti"
    | "location"
  >;
};

const profileSchema = z
  .object({
    nickname: z.string().trim().max(20),
    gender: z.enum(GENDERS),
    birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    calendar: z.enum(["solar", "lunar"]),
    leapMonth: z.boolean(),
    birthTime: z
      .string()
      .regex(/^([01]\d|2[0-3]):[0-5]\d$/)
      .nullable(),
    mbti: z.enum(MBTI_TYPES).nullable(),
    location: z.literal("KR"),
  })
  .strict()
  .refine((profile) => profile.calendar === "lunar" || !profile.leapMonth)
  .refine((profile) => {
    const [year, month, day] = profile.birthDate.split("-").map(Number);
    if (year < 1990 || year > 2050 || month < 1 || month > 12 || day < 1) {
      return false;
    }
    // Lunar dates can include February 30. Exact lunar/leap-month validity is
    // checked when generating the report, before the caller saves a profile.
    if (profile.calendar === "lunar") return day <= 30;
    const date = new Date(Date.UTC(year, month - 1, day));
    return (
      date.getUTCFullYear() === year &&
      date.getUTCMonth() === month - 1 &&
      date.getUTCDate() === day
    );
  });

const timestampSchema = z
  .number()
  .int()
  .nonnegative()
  .max(Number.MAX_SAFE_INTEGER);
const storedProfileSchema = z
  .object({
    version: z.literal(1),
    savedAt: timestampSchema,
    expiresAt: timestampSchema,
    profile: profileSchema,
  })
  .strict()
  .refine(
    (stored) => stored.expiresAt - stored.savedAt === BIRTH_PROFILE_TTL_MS,
  );

export function clearBirthProfile(
  storage: Pick<Storage, "removeItem">,
): boolean {
  try {
    storage.removeItem(BIRTH_PROFILE_STORAGE_KEY);
    return true;
  } catch {
    return false;
  }
}

export function loadBirthProfile(
  storage: Pick<Storage, "getItem" | "removeItem">,
  now = Date.now(),
): StoredBirthProfile | null {
  if (!timestampSchema.safeParse(now).success) return null;
  try {
    const raw = storage.getItem(BIRTH_PROFILE_STORAGE_KEY);
    if (raw === null) return null;
    const parsed =
      raw.length <= 2048
        ? storedProfileSchema.safeParse(JSON.parse(raw))
        : null;
    if (
      !parsed?.success ||
      parsed.data.savedAt > now ||
      now >= parsed.data.expiresAt
    ) {
      clearBirthProfile(storage);
      return null;
    }
    return parsed.data;
  } catch {
    // Invalid JSON and blocked browser storage must not prevent a reading.
    clearBirthProfile(storage);
    return null;
  }
}

export function saveBirthProfile(
  storage: Pick<Storage, "setItem">,
  input: BirthInput,
  now = Date.now(),
): StoredBirthProfile | null {
  try {
    // Keep this explicit allowlist: consultation text, consent, access codes,
    // selected content and report results must never enter shared storage.
    const parsed = storedProfileSchema.safeParse({
      version: 1,
      savedAt: now,
      expiresAt: now + BIRTH_PROFILE_TTL_MS,
      profile: {
        nickname: input.nickname,
        gender: input.gender,
        birthDate: input.birthDate,
        calendar: input.calendar,
        leapMonth: input.leapMonth,
        birthTime: input.birthTime,
        mbti: input.mbti,
        location: input.location,
      },
    });
    if (!parsed.success) return null;
    storage.setItem(BIRTH_PROFILE_STORAGE_KEY, JSON.stringify(parsed.data));
    return parsed.data;
  } catch {
    return null;
  }
}
