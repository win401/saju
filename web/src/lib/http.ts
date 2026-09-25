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
  // Use an explicit trusted origin; framework-internal URLs can use a different host.
  const trustedOrigin =
    process.env.APP_ORIGIN ||
    (process.env.NODE_ENV === "development"
      ? "http://127.0.0.1:4173"
      : undefined);
  return (
    !origin || (!!trustedOrigin && origin === new URL(trustedOrigin).origin)
  );
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
