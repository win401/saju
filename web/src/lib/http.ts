import { NextRequest, NextResponse } from "next/server";
export const SESSION_COOKIE = "gyeol_session";
export function json(data: unknown, status = 200) {
  return NextResponse.json(data, {
    status,
    headers: {
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
export function checkOrigin(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  // Trust deployment configuration, never client-supplied Host/X-Forwarded-Host.
  const configured = [process.env.APP_ORIGIN];
  if (process.env.NODE_ENV === "development")
    configured.push("http://127.0.0.1:4173");
  if (process.env.VERCEL === "1") {
    for (const host of [
      process.env.VERCEL_URL,
      process.env.VERCEL_PROJECT_PRODUCTION_URL,
      process.env.VERCEL_BRANCH_URL,
    ]) {
      if (host && /^[a-z0-9.-]+$/i.test(host))
        configured.push(`https://${host}`);
    }
  }
  return configured.some((value) => {
    if (!value) return false;
    try {
      return origin === new URL(value).origin;
    } catch {
      return false;
    }
  });
}
export async function readSmallJson(request: NextRequest): Promise<unknown> {
  if (!request.headers.get("content-type")?.startsWith("application/json"))
    throw new Error("JSON 형식으로 요청해주세요.");
  // Stream with a byte ceiling; Content-Length alone is not trustworthy.
  if (!request.body) throw new Error("입력 내용을 확인해주세요.");
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > 4096) {
        await reader.cancel();
        throw new Error("입력 내용이 너무 깁니다.");
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    throw new Error("입력 내용을 확인해주세요.");
  }
}
