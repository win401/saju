import { createHash, timingSafeEqual } from "node:crypto";
import type { LoveAiAvailability } from "../ai-contract";

export function loveAiAvailability(): LoveAiAvailability {
  const code = process.env.SAJU_AI_ACCESS_CODE?.trim() ?? "";
  const requiresAccessCode = process.env.NODE_ENV === "production" || !!code;
  return {
    available:
      process.env.SAJU_AI_ENABLED === "1" &&
      !!process.env.OPENAI_API_KEY?.trim() &&
      (!requiresAccessCode || code.length >= 16),
    requiresAccessCode,
  };
}

export function validAiAccessCode(provided: string | undefined): boolean {
  if (!loveAiAvailability().requiresAccessCode) return true;
  const expected = process.env.SAJU_AI_ACCESS_CODE?.trim();
  if (!expected || expected.length < 16 || !provided) return false;
  const digest = (value: string) => createHash("sha256").update(value).digest();
  return timingSafeEqual(digest(provided), digest(expected));
}

// Best-effort per-process burst protection, not a shared or monthly spend cap.
// Production also requires an owner-held access code; set provider spend limits.
export function createAiLimiter(now: () => number = Date.now) {
  let startedAt = now();
  let attempts = 0;
  let inFlight = 0;
  return {
    acquire(): (() => void) | null {
      const current = now();
      if (current - startedAt >= 10 * 60 * 1000) {
        startedAt = current;
        attempts = 0;
      }
      if (attempts >= 8 || inFlight >= 2) return null;
      attempts++;
      inFlight++;
      let released = false;
      return () => {
        if (!released) inFlight--;
        released = true;
      };
    },
  };
}

export const aiLimiter = createAiLimiter();
