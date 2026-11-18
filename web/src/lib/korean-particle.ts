type ParticlePair =
  | "은/는"
  | "이/가"
  | "을/를"
  | "과/와"
  | "으로/로"
  | "이라는/라는"
  | "이에요/예요";

/** Select a particle using the final syllable of a Hangul word or reading. */
export function koreanParticle(reading: string, pair: ParticlePair): string {
  const [withBatchim, withoutBatchim] = pair.split("/");
  const syllable = reading.charCodeAt(reading.length - 1);
  if (syllable < 0xac00 || syllable > 0xd7a3 || !reading) return withoutBatchim;

  const batchim = (syllable - 0xac00) % 28;
  // The directional particle also takes 로 after a final ㄹ.
  if (batchim === 0 || (pair === "으로/로" && batchim === 8))
    return withoutBatchim;
  return withBatchim;
}
