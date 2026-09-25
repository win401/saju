import { test, expect } from "@playwright/test";
const input = {
  nickname: "테스터",
  gender: "female",
  birthDate: "2000-01-07",
  calendar: "solar",
  leapMonth: false,
  birthTime: "12:00",
  mbti: "INFP",
  location: "KR",
};

test("input, preview, cancel, retry, full report and reset", async ({
  page,
}, testInfo) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await page.screenshot({
    path: `test-results/${testInfo.project.name}-input.png`,
    fullPage: true,
  });
  await page.getByLabel("별명").fill("테스터");
  await page.getByText("여성", { exact: true }).click();
  await page.getByLabel("태어난 날짜").fill("2000-01-07");
  await page.getByLabel("태어난 시간", { exact: true }).fill("12:00");
  await page.getByLabel("알고 있는 MBTI 유형").selectOption("INFP");
  await page.getByRole("button", { name: "나의 무료 요약 읽기" }).click();
  await expect(
    page.getByRole("heading", { name: "갑자일주, 자라는 나무의 이미지" }),
  ).toBeVisible();
  await expect(page.locator(".birth-meta")).toContainText("여성");
  await expect(
    page.getByRole("heading", { name: "INFP와 갑자일주를 나란히 읽으면" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "관계의 결, 조금 더 깊이" }),
  ).toHaveCount(0);
  await page.getByRole("button", { name: "전체 리포트 체험" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(
    page.getByRole("button", { name: "0원으로 전체 체험하기" }),
  ).toBeDisabled();
  await page.getByRole("button", { name: "결제 체험 닫기" }).click();
  await expect(page.getByRole("dialog")).not.toBeVisible();
  await page.getByRole("button", { name: "전체 리포트 체험" }).click();
  await page.getByLabel("실제 결제가 아닌 체험임을 확인했어요.").check();
  await page.getByRole("button", { name: "0원으로 전체 체험하기" }).click();
  await expect(
    page.getByRole("heading", { name: "관계의 결, 조금 더 깊이" }),
  ).toBeVisible();
  await page.screenshot({
    path: `test-results/${testInfo.project.name}-report.png`,
    fullPage: true,
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page
    .getByRole("button", { name: "입력 정보 지우고 다시 시작" })
    .click();
  await expect(page.getByLabel("별명")).toHaveValue("");
  await expect(page.getByLabel("태어난 날짜")).toHaveValue("");
  expect(errors).toEqual([]);
});
test("lunar February 30, unknown birth time and no MBTI", async ({ page }) => {
  await page.goto("/");
  await page.getByText("음력", { exact: true }).click();
  await page.getByText("밝히지 않음", { exact: true }).click();
  await page.getByLabel("태어난 날짜").fill("2024-02-30");
  await page.getByLabel("시간 모름").check();
  await page.getByRole("button", { name: "나의 무료 요약 읽기" }).click();
  await expect(
    page.getByText("양력 2024-04-08", { exact: false }),
  ).toBeVisible();
  await expect(
    page.getByText("유형을 몰라도, 나의 이야기는 계속됩니다"),
  ).toBeVisible();
  await expect(page.getByText("시간 미입력", { exact: true })).toBeVisible();
});
test("invalid lunar leap month shows a recoverable error", async ({ page }) => {
  await page.goto("/");
  await page.getByText("음력", { exact: true }).click();
  await page.getByText("여성", { exact: true }).click();
  await page.getByLabel("태어난 날짜").fill("2024-02-01");
  await page.getByLabel("음력 윤달에 태어났어요").check();
  await page.getByLabel("시간 모름").check();
  await page.getByRole("button", { name: "나의 무료 요약 읽기" }).click();
  await expect(page.locator(".error-box[role=alert]")).toContainText("윤달");
  await page.getByLabel("음력 윤달에 태어났어요").uncheck();
  await page.getByRole("button", { name: "나의 무료 요약 읽기" }).click();
  await expect(
    page.getByRole("heading", { name: "내 사주의 기본 구성" }),
  ).toBeVisible();
});
test("API preview omits paid chapters; separate sessions cannot unlock", async ({
  request,
  playwright,
}) => {
  const r = await request.post("/api/reports", { data: input });
  expect(r.status()).toBe(200);
  const preview = await r.json();
  expect(preview.chapters).toBeUndefined();
  const stranger = await playwright.request.newContext({
    baseURL: "http://127.0.0.1:4173",
  });
  expect(
    (
      await stranger.post(`/api/reports/${preview.id}/demo-checkout`, {
        data: { confirmed: true },
      })
    ).status(),
  ).toBe(404);
  expect(
    (
      await request.post(`/api/reports/${preview.id}/demo-checkout`, {
        data: { confirmed: false },
      })
    ).status(),
  ).toBe(400);
  expect(
    (
      await request.post(`/api/reports/${preview.id}/demo-checkout`, {
        data: { confirmed: true },
        headers: { Origin: "https://not-our-site.example" },
      })
    ).status(),
  ).toBe(403);
  const unlock = await request.post(
    `/api/reports/${preview.id}/demo-checkout`,
    { data: { confirmed: true } },
  );
  expect(unlock.status()).toBe(200);
  expect((await unlock.json()).chapters).toHaveLength(3);
  expect((await request.delete(`/api/reports/${preview.id}`)).status()).toBe(
    200,
  );
  expect(
    (
      await request.post(`/api/reports/${preview.id}/demo-checkout`, {
        data: { confirmed: true },
      })
    ).status(),
  ).toBe(404);
  await stranger.dispose();
});
