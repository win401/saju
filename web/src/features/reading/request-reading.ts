/** Bounded, cancellable requests for the non-AI reading flow. */
export async function requestReading<T>(
  path: string,
  body: unknown,
  signal: AbortSignal,
  timeoutMs = 15000,
): Promise<T> {
  const controller = new AbortController();
  let timedOut = false;
  const abort = () => controller.abort();
  signal.addEventListener("abort", abort, { once: true });
  if (signal.aborted) controller.abort();
  const timer = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, timeoutMs);
  try {
    const response = await fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    const data = await response.json().catch(() => {
      throw new Error("서버 응답을 읽지 못했어요. 잠시 후 다시 시도해주세요.");
    });
    if (!response.ok)
      throw new Error(
        typeof data?.error === "string"
          ? data.error
          : "결과를 불러오지 못했어요. 잠시 후 다시 시도해주세요.",
      );
    return data as T;
  } catch (error) {
    if (timedOut)
      throw new Error(
        "응답이 늦어지고 있어요. 입력은 그대로 두었으니 다시 시도해주세요.",
      );
    if (error instanceof TypeError)
      throw new Error("인터넷 연결을 확인하고 다시 시도해주세요.");
    throw error;
  } finally {
    clearTimeout(timer);
    signal.removeEventListener("abort", abort);
  }
}
