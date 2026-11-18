import { test, expect, type Page } from "@playwright/test";

const themes = [
  {
    id: "traditional",
    label: "정통 사주",
    lastChapter: "내 사주를 하나의 이야기로",
  },
  { id: "love", label: "연애 사주", lastChapter: "나에게 맞는 사랑의 방식" },
  { id: "mbti", label: "사주 × MBTI", lastChapter: "나만의 리듬으로 살아가기" },
] as const;

async function expectNoHorizontalOverflow(page: Page) {
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
}

async function expectBirthStorage(page: Page, mbti: string | null) {
  const stored = await page.evaluate(() => ({
    local: { ...localStorage },
    session: { ...sessionStorage },
    cookies: document.cookie,
  }));
  expect(Object.keys(stored.local)).toEqual(["gyeol.birth-profile.v1"]);
  const saved = JSON.parse(stored.local["gyeol.birth-profile.v1"]);
  expect(Object.keys(saved).sort()).toEqual([
    "expiresAt",
    "profile",
    "savedAt",
    "version",
  ]);
  expect(saved.version).toBe(1);
  expect(saved.expiresAt - saved.savedAt).toBe(24 * 60 * 60 * 1000);
  expect(saved.profile).toEqual({
    nickname: "배포테스터",
    gender: "female",
    birthDate: "2000-01-07",
    calendar: "solar",
    leapMonth: false,
    birthTime: "12:00",
    mbti,
    location: "KR",
  });
  expect(stored.session).toEqual({});
  expect(stored.cookies).toBe("");
  expect(
    (await page.context().cookies()).map(({ name }) => name),
  ).not.toContain("gyeol_session");
}

async function expectNoBirthStorage(page: Page) {
  expect(
    await page.evaluate(() => ({
      local: { ...localStorage },
      session: { ...sessionStorage },
      cookies: document.cookie,
    })),
  ).toEqual({ local: {}, session: {}, cookies: "" });
  expect(
    (await page.context().cookies()).map(({ name }) => name),
  ).not.toContain("gyeol_session");
}

for (const theme of themes) {
  test(`${theme.id}: public mobile-ready reading, full chapters, and reset`, async ({
    page,
  }, testInfo) => {
    const errors: string[] = [];
    const deletes: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("request", (request) => {
      if (request.method() === "DELETE") deletes.push(request.url());
    });

    const home = await page.goto("/");
    expect(home?.status()).toBe(200);
    for (const item of themes)
      await expect(
        page.locator(`a[href="/readings/${item.id}"]`).first(),
      ).toBeVisible();
    await expectNoHorizontalOverflow(page);
    if (theme.id === "traditional" && testInfo.project.name === "public-mobile")
      await page.screenshot({
        path: testInfo.outputPath("mobile-home.png"),
        fullPage: true,
      });

    await page.locator(`a[href="/readings/${theme.id}"]`).first().click();
    await expect(page).toHaveURL(new RegExp(`/readings/${theme.id}$`));
    await page.getByLabel("별명").fill("배포테스터");
    await page.getByText("여성", { exact: true }).click();
    await page.getByLabel("태어난 날짜").fill("2000-01-07");
    await page.getByLabel("태어난 시간", { exact: true }).fill("12:00");
    if (theme.id === "mbti")
      await page.getByLabel("알고 있는 MBTI 유형").selectOption("INFP");
    else await expect(page.getByLabel("알고 있는 MBTI 유형")).toHaveCount(0);

    const previewResponse = page.waitForResponse(
      (response) =>
        new URL(response.url()).pathname === "/api/reports" &&
        response.request().method() === "POST",
    );
    await page.getByRole("button", { name: "나의 무료 요약 읽기" }).click();
    const preview = await previewResponse;
    expect(preview.status()).toBe(200);
    expect(preview.headers()["set-cookie"]).toBeUndefined();
    const previewData = await preview.json();
    expect(previewData).toMatchObject({
      theme: theme.id,
      demoMode: "public",
      demoAvailable: true,
    });
    expect(previewData.chapters).toBeUndefined();
    expect(previewData.audit).toBeUndefined();
    await expect(
      page.locator(".reading-prose .narrative-section").first(),
    ).toBeVisible();
    await expect(page.locator(".birth-meta")).toContainText("여성");
    await expectBirthStorage(page, theme.id === "mbti" ? "INFP" : null);
    await expectNoHorizontalOverflow(page);

    const fullResponse = page.waitForResponse(
      (response) =>
        new URL(response.url()).pathname === "/api/demo/readings" &&
        response.request().method() === "POST",
    );
    await page.getByRole("button", { name: "전체 리포트 무료로 읽기" }).click();
    await expect(page.getByRole("dialog")).not.toBeVisible();
    const full = await fullResponse;
    expect(full.status()).toBe(200);
    expect(full.headers()["set-cookie"]).toBeUndefined();
    const fullData = await full.json();
    expect(fullData).toMatchObject({ unlocked: true, mode: "demo" });
    expect(fullData.chapters).toHaveLength(4);
    await expect(page.locator(".chapter-progress button")).toHaveCount(4);
    await expect(page.locator(".chapter-reader h3")).toBeVisible();
    await page
      .getByRole("button", { name: `4장 ${theme.lastChapter} 열기` })
      .click();
    await expect(page.locator(".chapter-reader h3")).toHaveText(
      theme.lastChapter,
    );
    await expectBirthStorage(page, theme.id === "mbti" ? "INFP" : null);
    await expectNoHorizontalOverflow(page);
    if (testInfo.project.name === "public-mobile")
      await page.screenshot({
        path: testInfo.outputPath(`mobile-${theme.id}-full.png`),
        fullPage: true,
      });

    await page
      .getByRole("button", { name: "입력 정보 지우고 다시 시작" })
      .click();
    await expect(page.getByLabel("별명")).toHaveValue("");
    await expect(page.getByLabel("태어난 날짜")).toHaveValue("");
    await expect(page.locator(".reading-result")).toHaveCount(0);
    await expectNoBirthStorage(page);
    expect(deletes).toEqual([]);
    expect(errors).toEqual([]);
  });
}

for (const theme of themes) {
  test(`${theme.id}: sample starts without personal input or saving a profile`, async ({
    page,
  }) => {
    await page.goto(`/readings/${theme.id}`);
    await page.getByRole("button", { name: "샘플로 바로 체험하기" }).click();
    await expect(page.locator(".sample-result-note")).toContainText(
      "샘플 결과",
    );
    await expect(page.locator(".birth-meta")).toContainText("2000-03-07");
    await expectNoBirthStorage(page);
    await page.getByRole("button", { name: "상세 4장 무료로 읽기" }).click();
    await expect(page.locator(".chapter-reader h3")).toBeVisible();
    await page
      .getByRole("button", { name: `4장 ${theme.lastChapter} 열기` })
      .click();
    await page.getByRole("button", { name: "내 정보로 읽어보기" }).click();
    await expect(page.getByLabel("태어난 날짜")).toHaveValue("");
    await expectNoBirthStorage(page);
  });
}

test("sample preserves a saved profile and a failed full report can be retried", async ({
  page,
}) => {
  await page.goto("/readings/traditional");
  await page.getByText("여성", { exact: true }).click();
  await page.getByLabel("별명").fill("보관테스터");
  await page.getByLabel("태어난 날짜").fill("2001-01-07");
  await page.getByLabel("태어난 시간", { exact: true }).fill("12:00");
  await page.getByRole("button", { name: "나의 무료 요약 읽기" }).click();
  await expect(page.locator(".reading-result")).toBeVisible();
  const stored = await page.evaluate(() =>
    localStorage.getItem("gyeol.birth-profile.v1"),
  );
  await page.getByRole("button", { name: "입력 수정" }).click();
  await page.getByRole("button", { name: "샘플로 바로 체험하기" }).click();
  await expect(page.locator(".sample-result-note")).toBeVisible();
  expect(
    await page.evaluate(() => localStorage.getItem("gyeol.birth-profile.v1")),
  ).toBe(stored);
  await page.route(
    "**/api/demo/readings",
    (route) =>
      route.fulfill({
        status: 503,
        contentType: "text/html",
        body: "Unavailable",
      }),
    { times: 1 },
  );
  await page.getByRole("button", { name: "상세 4장 무료로 읽기" }).click();
  await expect(page.locator(".error-box[role=alert]")).toContainText(
    "서버 응답을 읽지 못했어요",
  );
  await page.getByRole("button", { name: "상세 4장 무료로 읽기" }).click();
  await expect(page.locator(".chapter-reader h3")).toBeVisible();
  await page
    .getByRole("button", { name: "내 정보로 읽기", exact: false })
    .click();
  await expect(page.getByLabel("별명")).toHaveValue("보관테스터");
  await expect(page.getByLabel("태어난 날짜")).toHaveValue("2001-01-07");
});

test("deployed API accepts its public origin, rejects foreign origins, and keeps legacy checkout disabled", async ({
  request,
  baseURL,
}) => {
  const headers = { Origin: new URL(baseURL!).origin };
  const input = {
    theme: "traditional",
    nickname: "배포테스터",
    gender: "female",
    birthDate: "2000-01-07",
    calendar: "solar",
    leapMonth: false,
    birthTime: "12:00",
    mbti: null,
    location: "KR",
    focus: null,
  };
  const preview = await request.post("/api/reports", { headers, data: input });
  expect(preview.status()).toBe(200);
  expect(preview.headers()["cache-control"]).toContain("no-store");
  expect(preview.headers()["set-cookie"]).toBeUndefined();
  const data = await preview.json();
  expect(data.demoMode).toBe("public");
  expect(data.chapters).toBeUndefined();
  expect(data.audit).toBeUndefined();

  const full = await request.post("/api/demo/readings", {
    headers,
    data: { confirmed: true, input },
  });
  expect(full.status()).toBe(200);
  expect((await full.json()).chapters).toHaveLength(4);
  for (const [path, body] of [
    ["/api/reports", input],
    ["/api/demo/readings", { confirmed: true, input }],
  ] as const) {
    const rejected = await request.post(path, {
      headers: { Origin: "https://foreign-site.example" },
      data: body,
    });
    expect(rejected.status()).toBe(403);
  }
  const legacy = await request.post(`/api/reports/${data.id}/demo-checkout`, {
    headers,
    data: { confirmed: true },
  });
  expect(legacy.status()).toBe(403);
});
