import { afterEach, describe, expect, it, vi } from "vitest";
import { requestReading } from "../src/features/reading/request-reading";

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe("reading request recovery", () => {
  it("returns a friendly error when an upstream proxy sends HTML", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(new Response("<h1>Offline</h1>", { status: 503 })),
    );
    await expect(
      requestReading("/api/reports", {}, new AbortController().signal),
    ).rejects.toThrow("서버 응답을 읽지 못했어요");
  });
  it("bounds a hanging request and aborts its network work", async () => {
    vi.useFakeTimers();
    let aborted = false;
    vi.stubGlobal(
      "fetch",
      vi.fn(
        (_path, options) =>
          new Promise((_resolve, reject) => {
            options.signal.addEventListener("abort", () => {
              aborted = true;
              reject(new DOMException("Aborted", "AbortError"));
            });
          }),
      ),
    );
    const result = expect(
      requestReading("/api/reports", {}, new AbortController().signal, 100),
    ).rejects.toThrow("응답이 늦어지고 있어요");
    await vi.advanceTimersByTimeAsync(100);
    await result;
    expect(aborted).toBe(true);
  });
  it("preserves cancellation when the user leaves the reading", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(
        (_path, options) =>
          new Promise((_resolve, reject) => {
            options.signal.addEventListener("abort", () =>
              reject(new DOMException("Aborted", "AbortError")),
            );
          }),
      ),
    );
    const controller = new AbortController();
    const result = expect(
      requestReading("/api/reports", {}, controller.signal),
    ).rejects.toMatchObject({ name: "AbortError" });
    controller.abort();
    await result;
  });
});
