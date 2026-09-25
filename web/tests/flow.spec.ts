import { test, expect } from "@playwright/test";
const input = {
  theme: "love",
  nickname: "테스터",
  gender: "female",
  birthDate: "2000-01-07",
  calendar: "solar",
  leapMonth: false,
  birthTime: "12:00",
  mbti: "INFP",
  location: "KR",
};

test("home opens traditional reading with its own content and full report", async ({
  page,
}, testInfo) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  for (const theme of ["traditional", "love", "mbti"]) {
    await expect(
      page.locator(`a[href="/readings/${theme}"]`).first(),
    ).toBeVisible();
  }
  await page.screenshot({
    path: `test-results/${testInfo.project.name}-home.png`,
    fullPage: true,
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.locator('a[href="/readings/traditional"]').first().click();
  await expect(page).toHaveURL(/\/readings\/traditional$/);
  await expect(
    page.getByRole("heading", { name: /태어난 여덟 글자/ }),
  ).toBeVisible();
  await expect(page.getByLabel("알고 있는 MBTI 유형")).toHaveCount(0);
  await expect(
    page.getByRole("group", { name: "먼저 읽고 싶은 관계 장면" }),
  ).toHaveCount(0);
  await page.getByText("여성", { exact: true }).click();
  await page.getByLabel("태어난 날짜").fill("2000-01-07");
  await page.getByLabel("태어난 시간", { exact: true }).fill("12:00");
  await page.getByRole("button", { name: "나의 무료 요약 읽기" }).click();
  await expect(page.locator(".result-toolbar")).toContainText("정통 사주");
  await expect(
    page.locator(".reading-prose .narrative-section").first(),
  ).toBeVisible();
  await expect(page.locator(".comparison-card")).toContainText("오행");
  await page.locator(".reading-prose").screenshot({
    path: `test-results/${testInfo.project.name}-traditional-preview.png`,
  });
  await page.getByRole("button", { name: "전체 리포트 체험" }).click();
  await page.getByLabel("실제 결제가 아닌 체험임을 확인했어요.").check();
  await page.getByRole("button", { name: "0원으로 전체 체험하기" }).click();
  await expect(page.locator(".chapter-reader h3")).toHaveText(
    "십성으로 읽는 나의 재능",
  );
  await page.locator(".chapter-reader").screenshot({
    path: `test-results/${testInfo.project.name}-traditional-chapter.png`,
  });
  await page
    .getByRole("button", { name: "2장 일과 재물을 대하는 방식 열기" })
    .click();
  await expect(page.locator(".chapter-reader h3")).toHaveText(
    "일과 재물을 대하는 방식",
  );
  await page
    .getByRole("button", { name: "4장 내 사주를 하나의 이야기로 열기" })
    .click();
  await page.getByRole("link", { name: "다른 이야기 둘러보기" }).click();
  await expect(page).toHaveURL("http://127.0.0.1:4173/");
  expect(errors).toEqual([]);
});

test("MBTI is required only for the MBTI product and gives four distinct comparison chapters", async ({
  page,
  request,
}) => {
  await page.goto("/readings/mbti");
  await expect(
    page.getByRole("heading", { name: /내가 아는 나와/ }),
  ).toBeVisible();
  await expect(page.getByLabel("알고 있는 MBTI 유형")).toHaveAttribute(
    "required",
    "",
  );
  await page.getByText("남성", { exact: true }).click();
  await page.getByLabel("태어난 날짜").fill("2000-01-07");
  await page.getByLabel("시간 모름").check();
  await page.getByLabel("알고 있는 MBTI 유형").selectOption("INFP");
  await page.getByRole("button", { name: "나의 무료 요약 읽기" }).click();
  await expect(
    page.getByRole("heading", { name: "INFP와 갑자일주를 나란히 읽으면" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "전체 리포트 체험" }).click();
  await page.getByLabel("실제 결제가 아닌 체험임을 확인했어요.").check();
  await page.getByRole("button", { name: "0원으로 전체 체험하기" }).click();
  await expect(page.locator(".chapter-reader h3")).toHaveText(
    "에너지가 향하는 곳",
  );
  await page
    .getByRole("button", { name: "4장 나만의 리듬으로 살아가기 열기" })
    .click();
  await expect(page.locator(".chapter-reader h3")).toHaveText(
    "나만의 리듬으로 살아가기",
  );
  const invalid = await request.post("/api/reports", {
    data: { ...input, theme: "mbti", mbti: null },
  });
  expect(invalid.status()).toBe(400);
  await page.goto("/readings/not-a-theme");
  await expect(page.getByText("404")).toBeVisible();
});

test("love input, preview, cancel, retry, full report and reset", async ({
  page,
}, testInfo) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/readings/love");
  await expect(
    page.getByRole("heading", { name: /나는 어떤 순간에 마음을 내어줄까/ }),
  ).toBeVisible();
  await page.getByRole("button", { name: /마음을 전하는 말/ }).click();
  await expect(
    page.getByText("말하지 못한 마음의 장면부터 볼게요."),
  ).toBeVisible();
  await page.screenshot({
    path: `test-results/${testInfo.project.name}-input.png`,
    fullPage: true,
  });
  await page.getByLabel("별명").fill("테스터");
  await page.getByText("여성", { exact: true }).click();
  await page.getByLabel("태어난 날짜").fill("2000-01-07");
  await page.getByLabel("태어난 시간", { exact: true }).fill("12:00");
  await expect(page.getByLabel("알고 있는 MBTI 유형")).toHaveCount(0);
  await page.getByRole("button", { name: "나의 무료 요약 읽기" }).click();
  await expect(
    page.getByRole("heading", { name: "갑자일주, 자라는 나무의 이미지" }),
  ).toBeVisible();
  await expect(page.locator(".reading-prose .narrative-section")).toHaveCount(
    4,
  );
  await expect(page.locator(".reading-prose .narrative-lead")).toBeVisible();
  await page.locator(".reading-prose").screenshot({
    path: `test-results/${testInfo.project.name}-narrative-preview.png`,
  });
  await expect(page.locator(".birth-meta")).toContainText("여성");
  await expect(page.locator(".chosen-path-note")).toContainText(
    "마음을 전하는 말",
  );
  await expect(page.locator(".is-chosen-chapter")).toContainText(
    "마음을 전하는 방법",
  );
  await page.locator(".reading-prose .reading-evidence summary").click();
  await expect(page.locator(".reading-prose .reading-evidence")).toContainText(
    "이번 이야기의 관심 장면",
  );
  await expect(
    page.locator(".reading-prose .evidence-kind").first(),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", {
      name: "겉으로 전하는 마음과 가까운 사이의 나",
    }),
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
  await expect(page.locator(".chapter-reader h3")).toHaveText(
    "마음을 전하는 방법",
  );
  await expect(page.locator(".chapter-reader")).toContainText(
    "마음은 있는데 적절한 말이 떠오르지 않는 순간",
  );
  await expect(page.locator(".chapter-reader .narrative-scene")).toContainText(
    "마음이 보이는 시작",
  );
  await expect(page.locator(".chapter-reader .narrative-section")).toHaveCount(
    5,
  );
  await page.locator(".chapter-reader").screenshot({
    path: `test-results/${testInfo.project.name}-narrative-chapter.png`,
  });
  await page.getByRole("button", { name: "다음 장" }).click();
  await expect(page.locator(".chapter-reader h3")).toHaveText(
    "좋아하는데 자꾸 어긋나는 순간",
  );
  await page.getByRole("button", { name: "이전 장" }).click();
  await expect(page.locator(".chapter-reader h3")).toHaveText(
    "마음을 전하는 방법",
  );
  await page
    .getByRole("button", { name: "4장 나에게 맞는 사랑의 방식 열기" })
    .click();
  await expect(
    page.getByRole("button", { name: "입력 정보 지우고 다시 시작" }),
  ).toBeVisible();
  await expect(page.locator(".chapter-reader")).toContainText(
    "실제로 있었던 일 → 내가 느낀 마음 → 구체적인 부탁",
  );
  await page.locator(".chapter-reader .reading-evidence summary").click();
  await expect(page.locator(".chapter-reader .reading-evidence")).toContainText(
    "사용자가 ‘마음을 전하는 말’을 선택",
  );
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
  await page.goto("/readings/traditional");
  await page.getByText("음력", { exact: true }).click();
  await page.getByText("밝히지 않음", { exact: true }).click();
  await page.getByLabel("태어난 날짜").fill("2024-02-30");
  await page.getByLabel("시간 모름").check();
  await page.getByRole("button", { name: "나의 무료 요약 읽기" }).click();
  await expect(
    page.getByText("양력 2024-04-08", { exact: false }),
  ).toBeVisible();
  await expect(page.locator(".comparison-card h2")).toBeVisible();
  await expect(page.getByText("시간 미입력", { exact: true })).toBeVisible();
});
test("invalid lunar leap month shows a recoverable error", async ({ page }) => {
  await page.goto("/readings/traditional");
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
  const r = await request.post("/api/reports", {
    data: { ...input, focus: "boundary" },
  });
  expect(r.status()).toBe(200);
  const preview = await r.json();
  expect(preview.chapters).toBeUndefined();
  expect(preview.audit).toBeUndefined();
  expect(preview.focus).toBe("boundary");
  expect(preview.intro.evidence).toEqual(
    expect.arrayContaining([expect.objectContaining({ kind: "focus" })]),
  );
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
  expect((await unlock.json()).chapters).toHaveLength(4);
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
