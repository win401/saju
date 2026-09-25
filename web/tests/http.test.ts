import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { checkOrigin } from "../src/lib/http";

const configuredHosts = [
  "VERCEL_URL",
  "VERCEL_PROJECT_PRODUCTION_URL",
  "VERCEL_BRANCH_URL",
] as const;

function request(origin?: string, headers: Record<string, string> = {}) {
  return new NextRequest("https://request-host.example/api/reports", {
    headers: { ...(origin ? { origin } : {}), ...headers },
  });
}

beforeEach(() => {
  vi.stubEnv("NODE_ENV", "production");
  for (const key of ["APP_ORIGIN", "VERCEL", ...configuredHosts])
    vi.stubEnv(key, undefined);
});
afterEach(() => vi.unstubAllEnvs());

describe("deployment Origin validation", () => {
  it("allows non-browser requests without an Origin header", () => {
    expect(checkOrigin(request())).toBe(true);
  });

  it("allows only the exact configured application origin", () => {
    vi.stubEnv("APP_ORIGIN", "https://gyeol.example/a-path");
    expect(checkOrigin(request("https://gyeol.example"))).toBe(true);
    expect(checkOrigin(request("http://gyeol.example"))).toBe(false);
    expect(checkOrigin(request("https://gyeol.example:8443"))).toBe(false);
    expect(checkOrigin(request("https://sub.gyeol.example"))).toBe(false);
  });

  it.each(configuredHosts)("trusts the exact %s host only on Vercel", (key) => {
    vi.stubEnv(key, "gyeol-verified.vercel.app");
    expect(checkOrigin(request("https://gyeol-verified.vercel.app"))).toBe(
      false,
    );
    vi.stubEnv("VERCEL", "1");
    expect(checkOrigin(request("https://gyeol-verified.vercel.app"))).toBe(
      true,
    );
    expect(checkOrigin(request("http://gyeol-verified.vercel.app"))).toBe(
      false,
    );
    expect(checkOrigin(request("https://other.vercel.app"))).toBe(false);
    expect(
      checkOrigin(
        request("https://gyeol-verified.vercel.app.attacker.example"),
      ),
    ).toBe(false);
  });

  it("does not trust incoming Host or X-Forwarded-Host headers", () => {
    vi.stubEnv("VERCEL", "1");
    vi.stubEnv("VERCEL_URL", "gyeol-verified.vercel.app");
    expect(
      checkOrigin(
        request("https://attacker.example", {
          host: "attacker.example",
          "x-forwarded-host": "attacker.example",
        }),
      ),
    ).toBe(false);
    expect(checkOrigin(request("https://request-host.example"))).toBe(false);
  });

  it("allows localhost only for development unless explicitly configured", () => {
    expect(checkOrigin(request("http://127.0.0.1:4173"))).toBe(false);
    vi.stubEnv("NODE_ENV", "development");
    expect(checkOrigin(request("http://127.0.0.1:4173"))).toBe(true);
    expect(checkOrigin(request("http://127.0.0.1:4174"))).toBe(false);
    expect(checkOrigin(request("http://localhost:4173"))).toBe(false);
  });

  it("handles malformed configuration without throwing or opening access", () => {
    vi.stubEnv("APP_ORIGIN", "not a URL");
    vi.stubEnv("VERCEL", "1");
    vi.stubEnv("VERCEL_URL", "gyeol.vercel.app/path");
    vi.stubEnv("VERCEL_PROJECT_PRODUCTION_URL", "https://gyeol.vercel.app");
    vi.stubEnv("VERCEL_BRANCH_URL", "gyeol.vercel.app@attacker.example");
    expect(checkOrigin(request("https://gyeol.vercel.app"))).toBe(false);
    expect(checkOrigin(request("https://attacker.example"))).toBe(false);
    expect(checkOrigin(request("null"))).toBe(false);
  });
});
