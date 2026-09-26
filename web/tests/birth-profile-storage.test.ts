import { describe, expect, it, vi } from "vitest";
import {
  BIRTH_PROFILE_STORAGE_KEY,
  BIRTH_PROFILE_TTL_MS,
  clearBirthProfile,
  loadBirthProfile,
  saveBirthProfile,
} from "../src/features/reading/birth-profile-storage";
import type { BirthInput } from "../src/types/reading";

const now = Date.UTC(2026, 8, 26, 12);
const input: BirthInput = {
  theme: "traditional",
  nickname: "체험",
  gender: "undisclosed",
  birthDate: "2000-02-29",
  calendar: "solar",
  leapMonth: false,
  birthTime: "12:30",
  mbti: "INFP",
  location: "KR",
  focus: "expression",
};

function memoryStorage() {
  const data = new Map<string, string>();
  return {
    data,
    getItem: vi.fn((key: string) => data.get(key) ?? null),
    setItem: vi.fn((key: string, value: string) => data.set(key, value)),
    removeItem: vi.fn((key: string) => {
      data.delete(key);
    }),
  };
}

function storedValue() {
  const storage = memoryStorage();
  saveBirthProfile(storage, input, now);
  return JSON.parse(storage.data.get(BIRTH_PROFILE_STORAGE_KEY)!);
}

describe("shared birth profile storage", () => {
  it("round-trips the birth profile for exactly 24 hours without extending expiry on reads", () => {
    const storage = memoryStorage();
    const saved = saveBirthProfile(storage, input, now);
    expect(BIRTH_PROFILE_TTL_MS).toBe(86_400_000);
    expect(saved).toMatchObject({
      version: 1,
      savedAt: now,
      expiresAt: now + BIRTH_PROFILE_TTL_MS,
    });
    expect(loadBirthProfile(storage, now)).toEqual(saved);
    expect(loadBirthProfile(storage, now + BIRTH_PROFILE_TTL_MS - 1)).toEqual(
      saved,
    );
    expect(storage.setItem).toHaveBeenCalledTimes(1);
    expect(loadBirthProfile(storage, now + BIRTH_PROFILE_TTL_MS)).toBeNull();
    expect(storage.data.has(BIRTH_PROFILE_STORAGE_KEY)).toBe(false);
  });

  it.each(["traditional", "love", "mbti"] as const)(
    "preserves selected MBTI across the %s content while excluding unrelated data",
    (theme) => {
      const storage = memoryStorage();
      const extraInput = {
        ...input,
        theme,
        question: "private question",
        accessCode: "private access code",
        consent: true,
        results: { private: "answer" },
      };
      saveBirthProfile(storage, extraInput, now);
      const saved = loadBirthProfile(storage, now)!;
      expect(saved.profile.mbti).toBe("INFP");
      expect(Object.keys(saved.profile).sort()).toEqual([
        "birthDate",
        "birthTime",
        "calendar",
        "gender",
        "leapMonth",
        "location",
        "mbti",
        "nickname",
      ]);
      expect(Object.keys(saved).sort()).toEqual([
        "expiresAt",
        "profile",
        "savedAt",
        "version",
      ]);
      expect(storage.data.get(BIRTH_PROFILE_STORAGE_KEY)).not.toContain(
        "private",
      );
    },
  );

  it("supports unknown birth time, empty nickname and unselected MBTI", () => {
    const storage = memoryStorage();
    const saved = saveBirthProfile(
      storage,
      { ...input, birthTime: null, mbti: null, nickname: "" },
      now,
    );
    expect(saved).not.toBeNull();
    expect(loadBirthProfile(storage, now)?.profile).toMatchObject({
      birthTime: null,
      mbti: null,
      nickname: "",
    });
  });

  it("does not apply Gregorian February rules to a lunar date or discard the leap month flag", () => {
    const storage = memoryStorage();
    const saved = saveBirthProfile(
      storage,
      { ...input, birthDate: "2004-02-30", calendar: "lunar", leapMonth: true },
      now,
    );
    expect(saved).not.toBeNull();
    expect(loadBirthProfile(storage, now)?.profile).toMatchObject({
      birthDate: "2004-02-30",
      calendar: "lunar",
      leapMonth: true,
    });
  });

  it("replaces only the shared profile when a new completed reading is saved", () => {
    const storage = memoryStorage();
    storage.data.set("unrelated", "keep");
    saveBirthProfile(storage, input, now);
    const saved = saveBirthProfile(
      storage,
      { ...input, nickname: "새 별명" },
      now + 1000,
    );
    expect(saved?.savedAt).toBe(now + 1000);
    expect(loadBirthProfile(storage, now + 1000)?.profile.nickname).toBe(
      "새 별명",
    );
    expect(storage.data.get("unrelated")).toBe("keep");
  });

  it.each([
    { gender: null },
    { gender: "unknown" },
    { calendar: "other" },
    { leapMonth: true },
    { leapMonth: "false" },
    { mbti: "XXXX" },
    { mbti: "infp" },
    { nickname: "a".repeat(21) },
    { birthDate: "2001-02-29" },
    { birthDate: "2000-04-31" },
    { birthDate: "2000-00-01" },
    { birthDate: "2000-13-01" },
    { birthDate: "2000-01-00" },
    { birthDate: "2000-1-01" },
    { birthDate: "1989-12-31" },
    { birthDate: "2051-01-01" },
    { birthDate: "2000-01-31", calendar: "lunar" },
    { birthTime: "24:00" },
    { birthTime: "12:60" },
    { birthTime: "9:30" },
    { birthTime: "" },
    { location: "US" },
  ])(
    "rejects invalid or incomplete birth fields on save and load: %j",
    (overrides) => {
      const storage = memoryStorage();
      expect(
        saveBirthProfile(
          storage,
          { ...input, ...overrides } as BirthInput,
          now,
        ),
      ).toBeNull();
      expect(storage.setItem).not.toHaveBeenCalled();
      const invalid = storedValue();
      Object.assign(invalid.profile, overrides);
      storage.data.set(BIRTH_PROFILE_STORAGE_KEY, JSON.stringify(invalid));
      expect(loadBirthProfile(storage, now)).toBeNull();
      expect(storage.data.has(BIRTH_PROFILE_STORAGE_KEY)).toBe(false);
    },
  );

  it.each([
    { version: 2 },
    { version: "1" },
    { savedAt: now + 1, expiresAt: now + 1 + BIRTH_PROFILE_TTL_MS },
    { savedAt: -1 },
    { savedAt: null },
    { savedAt: "2026-09-26" },
    { savedAt: now + 0.5 },
    { expiresAt: now },
    { expiresAt: now + BIRTH_PROFILE_TTL_MS + 1 },
    { expiresAt: now + BIRTH_PROFILE_TTL_MS - 1 },
    { expiresAt: null },
    { expiresAt: Number.MAX_SAFE_INTEGER + 1 },
    { extra: "unexpected" },
  ])(
    "removes an invalid, future or altered storage envelope: %j",
    (overrides) => {
      const storage = memoryStorage();
      storage.data.set(
        BIRTH_PROFILE_STORAGE_KEY,
        JSON.stringify({ ...storedValue(), ...overrides }),
      );
      expect(loadBirthProfile(storage, now)).toBeNull();
      expect(storage.data.has(BIRTH_PROFILE_STORAGE_KEY)).toBe(false);
    },
  );

  it.each(["{broken", "null", "[]", "{}", " ".repeat(2049)])(
    "discards unreadable storage safely",
    (raw) => {
      const storage = memoryStorage();
      storage.data.set(BIRTH_PROFILE_STORAGE_KEY, raw);
      expect(loadBirthProfile(storage, now)).toBeNull();
      expect(storage.data.has(BIRTH_PROFILE_STORAGE_KEY)).toBe(false);
    },
  );

  it("rejects missing fields and unexpected private data in a stored profile", () => {
    for (const malformed of [
      { ...storedValue().profile, birthTime: undefined },
      { ...storedValue().profile, accessCode: "private" },
    ]) {
      const storage = memoryStorage();
      storage.data.set(
        BIRTH_PROFILE_STORAGE_KEY,
        JSON.stringify({ ...storedValue(), profile: malformed }),
      );
      expect(loadBirthProfile(storage, now)).toBeNull();
      expect(storage.data.has(BIRTH_PROFILE_STORAGE_KEY)).toBe(false);
    }
  });

  it.each([NaN, Infinity, -Infinity, -1, Number.MAX_SAFE_INTEGER])(
    "does not persist invalid clocks or overflowed expiry: %s",
    (time) => {
      const storage = memoryStorage();
      expect(saveBirthProfile(storage, input, time)).toBeNull();
      expect(storage.setItem).not.toHaveBeenCalled();
    },
  );

  it("returns null for invalid read clocks without modifying stored data", () => {
    const storage = memoryStorage();
    saveBirthProfile(storage, input, now);
    expect(loadBirthProfile(storage, NaN)).toBeNull();
    expect(storage.removeItem).not.toHaveBeenCalled();
  });

  it("does not fail the reading when the browser blocks reads, writes or removal", () => {
    const blocked = () => {
      throw new Error("Storage blocked");
    };
    expect(
      loadBirthProfile({ getItem: blocked, removeItem: blocked }, now),
    ).toBeNull();
    expect(
      loadBirthProfile({ getItem: () => "broken", removeItem: blocked }, now),
    ).toBeNull();
    expect(saveBirthProfile({ setItem: blocked }, input, now)).toBeNull();
    expect(clearBirthProfile({ removeItem: blocked })).toBe(false);
  });

  it("explicitly clears only the shared profile and treats an absent profile as empty", () => {
    const storage = memoryStorage();
    expect(loadBirthProfile(storage, now)).toBeNull();
    expect(storage.removeItem).not.toHaveBeenCalled();
    storage.data.set("unrelated", "keep");
    saveBirthProfile(storage, input, now);
    expect(clearBirthProfile(storage)).toBe(true);
    expect(storage.data.has(BIRTH_PROFILE_STORAGE_KEY)).toBe(false);
    expect(storage.data.get("unrelated")).toBe("keep");
  });
});
