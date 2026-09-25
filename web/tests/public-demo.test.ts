import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { POST as createPreview } from "../src/app/api/reports/route";
import { POST as readPublicDemo } from "../src/app/api/demo/readings/route";
import { birthSchema } from "../src/lib/birth-schema";
import { calculateChart } from "../src/lib/saju";
import { createThemedReport } from "../src/features/reading/server/create-report";
import * as reportStore from "../src/features/reading/server/report-store";
import { READING_THEMES, type ReadingTheme } from "../src/types/reading";

const origin = "https://saju-demo.example";
const inputFor = (theme: ReadingTheme = "traditional") => ({
  theme,
  nickname: "체험",
  gender: "undisclosed",
  birthDate: "2000-01-07",
  calendar: "solar",
  leapMonth: false,
  birthTime: "12:00",
  mbti: theme === "mbti" ? "INFP" : null,
  location: "KR",
  focus: theme === "love" ? "expression" : null,
});

function request(
  path: string,
  body: unknown,
  overrides: Record<string, string> = {},
) {
  return new NextRequest(`${origin}${path}`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      origin,
      ...overrides,
    },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.stubEnv("NODE_ENV", "production");
  vi.stubEnv("APP_ORIGIN", origin);
  vi.stubEnv("SAJU_PUBLIC_DEMO", "1");
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
});

describe("public demo deployment", () => {
  it.each(READING_THEMES)(
    "%s preview and full reading work without stored reports or cookies",
    async (theme) => {
      const store = vi.spyOn(reportStore, "createStoredReport");
      const input = inputFor(theme);
      const previewResponse = await createPreview(
        request("/api/reports", input),
      );
      expect(previewResponse.status).toBe(200);
      expect(previewResponse.headers.get("set-cookie")).toBeNull();
      expect(previewResponse.headers.get("cache-control")).toBe("no-store");
      const preview = await previewResponse.json();
      expect(preview).toMatchObject({
        theme,
        demoAvailable: true,
        demoMode: "public",
      });
      expect(preview.id).toEqual(expect.any(String));
      expect(preview.chapters).toBeUndefined();
      expect(preview.audit).toBeUndefined();
      expect(preview.input).toBeUndefined();
      expect(preview.owner).toBeUndefined();

      // No id or session from preview is forwarded. A separate instance can
      // compute the same free content from this request alone.
      const fullResponse = await readPublicDemo(
        request("/api/demo/readings", { confirmed: true, input }),
      );
      expect(fullResponse.status).toBe(200);
      expect(fullResponse.headers.get("set-cookie")).toBeNull();
      expect(fullResponse.headers.get("cache-control")).toBe("no-store");
      const full = await fullResponse.json();
      const validatedInput = birthSchema.parse(input);
      const expected = createThemedReport(
        validatedInput,
        calculateChart(validatedInput),
      );
      expect(full.chapters).toEqual(expected.chapters);
      expect(full.chapters).toHaveLength(4);
      expect(Object.keys(full).sort()).toEqual([
        "chapters",
        "mode",
        "unlocked",
      ]);
      expect(full).toMatchObject({ unlocked: true, mode: "demo" });
      expect(store).not.toHaveBeenCalled();
    },
  );

  it("can read a free full report without any preceding preview request", async () => {
    const result = await readPublicDemo(
      request("/api/demo/readings", {
        confirmed: true,
        input: inputFor(),
      }),
    );
    expect(result.status).toBe(200);
    expect((await result.json()).chapters).toHaveLength(4);
  });

  it.each([undefined, "0", "true"])(
    "production rejects the full endpoint unless the flag is exactly 1 (%s)",
    async (flag) => {
      vi.stubEnv("SAJU_PUBLIC_DEMO", flag);
      const result = await readPublicDemo(
        request("/api/demo/readings", {
          confirmed: true,
          input: inputFor(),
        }),
      );
      expect(result.status).toBe(403);
      expect(result.headers.get("set-cookie")).toBeNull();
      expect((await result.json()).chapters).toBeUndefined();
    },
  );

  it("keeps the ordinary production preview non-demo when the public flag is off", async () => {
    vi.stubEnv("SAJU_PUBLIC_DEMO", undefined);
    const result = await createPreview(request("/api/reports", inputFor()));
    expect(result.status).toBe(200);
    const preview = await result.json();
    expect(preview).toMatchObject({ demoAvailable: false, demoMode: null });
    expect(preview.chapters).toBeUndefined();
    expect(preview.audit).toBeUndefined();
  });

  it.each([createPreview, readPublicDemo])(
    "rejects a foreign Origin before generating content",
    async (handler) => {
      const result = await handler(
        request(
          "/api/demo/readings",
          { confirmed: true, input: inputFor() },
          { origin: "https://another-site.example" },
        ),
      );
      expect(result.status).toBe(403);
      expect(result.headers.get("set-cookie")).toBeNull();
    },
  );

  it.each([
    { input: inputFor() },
    { confirmed: false, input: inputFor() },
    { confirmed: "true", input: inputFor() },
    { confirmed: true },
    { confirmed: true, input: { ...inputFor(), gender: null } },
    { confirmed: true, input: { ...inputFor("mbti"), mbti: null } },
    { confirmed: true, input: { ...inputFor(), theme: "unrecognized" } },
    { confirmed: true, input: { ...inputFor(), unlocked: true } },
    { confirmed: true, input: inputFor(), unlocked: true },
    { confirmed: true, input: { ...inputFor(), birthDate: "2000-02-31" } },
  ])("rejects unconfirmed or invalid input: %j", async (body) => {
    const result = await readPublicDemo(request("/api/demo/readings", body));
    expect(result.status).toBe(400);
    expect((await result.json()).chapters).toBeUndefined();
    expect(result.headers.get("set-cookie")).toBeNull();
  });

  it("enforces the existing request size ceiling", async () => {
    const result = await readPublicDemo(
      request("/api/demo/readings", {
        confirmed: true,
        input: inputFor(),
        extra: "x".repeat(4096),
      }),
    );
    expect(result.status).toBe(400);
    expect((await result.json()).error).toContain("너무 깁니다");
  });

  it("rejects non-JSON requests", async () => {
    const result = await readPublicDemo(
      request(
        "/api/demo/readings",
        { confirmed: true, input: inputFor() },
        { "content-type": "text/plain" },
      ),
    );
    expect(result.status).toBe(400);
  });
});
