import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
const mock = vi.hoisted(() => ({ generate: vi.fn() }));
vi.mock("../src/features/relationship/server/ai-love", () => ({
  generateLoveConsultation: mock.generate,
  AiLoveError: class extends Error {
    constructor(public code: string) {
      super("private provider detail");
    }
  },
}));
import { GET, POST } from "../src/app/api/ai/love/route";
import { AiLoveError } from "../src/features/relationship/server/ai-love";
import {
  aiLimiter,
  createAiLimiter,
} from "../src/features/relationship/server/ai-access";

const origin = "https://gyeol-test.example";
const code = "test-only-owner-code-2026";
const input = {
  theme: "love",
  nickname: "테스트",
  gender: "female",
  birthDate: "2000-01-07",
  calendar: "solar",
  leapMonth: false,
  birthTime: "12:00",
  mbti: null,
  location: "KR",
  focus: null,
};
const body = {
  input,
  situation: {
    status: "single",
    question: "새로운 사람을 만날 때 너무 서두르는 것 같아요.",
  },
  consent: true,
  accessCode: code,
};
const release = vi.fn();
function request(
  payload: unknown = body,
  headers: Record<string, string> = {},
) {
  return new NextRequest(`${origin}/api/ai/love`, {
    method: "POST",
    headers: { origin, "content-type": "application/json", ...headers },
    body: JSON.stringify(payload),
  });
}

beforeEach(() => {
  vi.stubEnv("NODE_ENV", "production");
  vi.stubEnv("APP_ORIGIN", origin);
  vi.stubEnv("SAJU_AI_ENABLED", "1");
  vi.stubEnv("OPENAI_API_KEY", "test-no-live-key");
  vi.stubEnv("SAJU_AI_ACCESS_CODE", code);
  vi.spyOn(aiLimiter, "acquire").mockReturnValue(release);
  mock.generate.mockResolvedValue({
    source: "openai",
    reading: { title: "시험 응답" },
    evidence: [],
    limitation: "운세 시기는 계산하지 않아요.",
  });
});
afterEach(() => {
  vi.restoreAllMocks();
  vi.clearAllMocks();
  vi.unstubAllEnvs();
});

describe("AI love endpoint", () => {
  it("advertises availability without exposing configuration or caching it", async () => {
    const result = await GET();
    expect(await result.json()).toEqual({
      available: true,
      requiresAccessCode: true,
    });
    expect(result.headers.get("cache-control")).toBe("no-store");
    expect(result.headers.get("set-cookie")).toBeNull();
  });
  it.each([
    ["SAJU_AI_ENABLED", "0"],
    ["SAJU_AI_ENABLED", "true"],
    ["OPENAI_API_KEY", ""],
    ["SAJU_AI_ACCESS_CODE", ""],
    ["SAJU_AI_ACCESS_CODE", "too-short"],
  ])(
    "fails closed before calling OpenAI when %s is %s",
    async (name, value) => {
      vi.stubEnv(name, value);
      expect((await (await GET()).json()).available).toBe(false);
      expect((await POST(request())).status).toBe(503);
      expect(mock.generate).not.toHaveBeenCalled();
    },
  );
  it("requires the owner code in production, rejects foreign origins and never calls provider", async () => {
    for (const accessCode of [undefined, "wrong-code-value-2026"])
      expect((await POST(request({ ...body, accessCode }))).status).toBe(403);
    expect(
      (await POST(request(body, { origin: "https://foreign.example" }))).status,
    ).toBe(403);
    expect(mock.generate).not.toHaveBeenCalled();
  });
  it.each([
    { ...body, consent: false },
    { ...body, situation: { ...body.situation, question: "짧음" } },
    { ...body, situation: { ...body.situation, question: "가".repeat(501) } },
    { ...body, situation: { ...body.situation, status: "unknown" } },
    { ...body, input: { ...input, theme: "traditional" } },
    { ...body, input: { ...input, birthDate: "2000-02-31" } },
    { ...body, facts: { dayMaster: "forged" } },
    { ...body, situation: { ...body.situation, systemPrompt: "forged" } },
  ])(
    "rejects invalid, nonconsensual or forged requests before paid calls",
    async (payload) => {
      expect((await POST(request(payload))).status).toBe(400);
      expect(mock.generate).not.toHaveBeenCalled();
      expect(release).not.toHaveBeenCalled();
    },
  );
  it("rejects oversized and non-JSON input before paid calls", async () => {
    expect(
      (await POST(request({ ...body, overflow: "x".repeat(5000) }))).status,
    ).toBe(400);
    expect(
      (await POST(request(body, { "content-type": "text/plain" }))).status,
    ).toBe(400);
    expect(mock.generate).not.toHaveBeenCalled();
  });
  it("passes only birth and situation to service; never passes access code or stores cookies", async () => {
    const result = await POST(request());
    expect(result.status).toBe(200);
    expect(mock.generate).toHaveBeenCalledExactlyOnceWith(
      input,
      body.situation,
    );
    expect(result.headers.get("cache-control")).toBe("no-store");
    expect(result.headers.get("set-cookie")).toBeNull();
    expect(release).toHaveBeenCalledTimes(1);
  });
  it("returns retry information when process burst protection is full", async () => {
    vi.mocked(aiLimiter.acquire).mockReturnValue(null);
    const result = await POST(request());
    expect(result.status).toBe(429);
    expect(result.headers.get("retry-after")).toBe("600");
    expect(mock.generate).not.toHaveBeenCalled();
  });
  it.each([
    new Error("secret raw provider request"),
    new AiLoveError("invalid_output"),
  ])(
    "sanitizes errors and releases capacity without an automatic paid retry",
    async (error) => {
      mock.generate.mockRejectedValue(error);
      const result = await POST(request());
      expect(result.status).toBe(502);
      expect(await result.text()).not.toMatch(/secret|private|provider/);
      expect(mock.generate).toHaveBeenCalledTimes(1);
      expect(release).toHaveBeenCalledTimes(1);
    },
  );
  it("uses a recoverable timeout response and releases capacity", async () => {
    mock.generate.mockRejectedValue(new AiLoveError("timeout"));
    expect((await POST(request())).status).toBe(504);
    expect(release).toHaveBeenCalledTimes(1);
  });
  it.each([
    ["quota_exceeded", 503],
    ["invalid_credentials", 503],
    ["rate_limit", 429],
  ] as const)(
    "reports a safe %s category without raw provider details",
    async (code, status) => {
      mock.generate.mockRejectedValue(new AiLoveError(code));
      const result = await POST(request());
      expect(result.status).toBe(status);
      expect(await result.json()).toMatchObject({
        code,
        error: expect.any(String),
      });
      expect(release).toHaveBeenCalledTimes(1);
    },
  );
  it("allows local testing without an access code but still needs enable flag and key", async () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("SAJU_AI_ACCESS_CODE", "");
    expect(await (await GET()).json()).toEqual({
      available: true,
      requiresAccessCode: false,
    });
    expect(
      (await POST(request({ ...body, accessCode: undefined }))).status,
    ).toBe(200);
  });
});

describe("per-process AI burst protection", () => {
  it("bounds concurrent paid calls, counts failures too, resets after its window", () => {
    let now = 0;
    const limiter = createAiLimiter(() => now);
    const first = limiter.acquire()!;
    const second = limiter.acquire()!;
    expect(limiter.acquire()).toBeNull();
    first();
    first(); // Releasing twice must not open another slot.
    const third = limiter.acquire()!;
    expect(limiter.acquire()).toBeNull();
    second();
    third();
    for (let index = 0; index < 5; index++) limiter.acquire()!();
    expect(limiter.acquire()).toBeNull();
    now = 600_000;
    expect(limiter.acquire()).toEqual(expect.any(Function));
  });
});
