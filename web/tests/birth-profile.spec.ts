import { test, expect, type Page } from "@playwright/test";

const profileKey = "gyeol.birth-profile.v1";
const rememberLabel = "이 브라우저에 내 정보 24시간 기억하기";
const restoredMessage = "저장된 내 정보를 불러왔어요.";
const profile = {
  nickname: "정보테스터",
  gender: "female",
  birthDate: "2000-01-07",
  calendar: "solar",
  leapMonth: false,
  birthTime: "12:00",
  mbti: null,
  location: "KR",
};

test.beforeEach(async ({ page }) => {
  // Profile tests only generate the ordinary free reports. Never send a paid
  // OpenAI request, even when this suite runs against the public deployment.
  await page.route("**/api/ai/love", async (route) => {
    expect(route.request().method()).toBe("GET");
    await route.fulfill({
      json: { available: false, requiresAccessCode: false },
    });
  });
});

async function fillProfile(page: Page) {
  await page.getByLabel("별명").fill(profile.nickname);
  await page.getByText("여성", { exact: true }).click();
  await page.getByLabel("태어난 날짜").fill(profile.birthDate);
  await page.getByLabel("태어난 시간", { exact: true }).fill(profile.birthTime);
}

async function expectProfileFields(page: Page) {
  await expect(page.getByLabel("별명")).toHaveValue(profile.nickname);
  await expect(page.getByLabel("여성", { exact: true })).toBeChecked();
  await expect(page.getByLabel("양력", { exact: true })).toBeChecked();
  await expect(page.getByLabel("태어난 날짜")).toHaveValue(profile.birthDate);
  await expect(page.getByLabel("태어난 시간", { exact: true })).toHaveValue(
    profile.birthTime,
  );
}

async function submitFreeReport(page: Page) {
  const responseReady = page.waitForResponse(
    (response) =>
      new URL(response.url()).pathname === "/api/reports" &&
      response.request().method() === "POST",
  );
  await page.getByRole("button", { name: "나의 무료 요약 읽기" }).click();
  const response = await responseReady;
  expect(response.status()).toBe(200);
  await expect(page.locator(".reading-result")).toBeVisible();
  return response.request().postDataJSON();
}

async function storedProfile(page: Page) {
  return page.evaluate((key) => {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : null;
  }, profileKey);
}

test("one profile survives reload and all three products without leaking theme or clearing MBTI", async ({
  page,
}, testInfo) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/readings/traditional");
  await expect(page.getByLabel(rememberLabel)).toBeChecked();
  await fillProfile(page);
  expect(await storedProfile(page)).toBeNull();
  const traditional = await submitFreeReport(page);
  expect(traditional).toMatchObject({
    theme: "traditional",
    mbti: null,
    focus: null,
  });
  const firstSaved = await storedProfile(page);
  expect(firstSaved.profile).toEqual(profile);
  expect(Object.keys(firstSaved).sort()).toEqual([
    "expiresAt",
    "profile",
    "savedAt",
    "version",
  ]);
  expect(firstSaved.expiresAt - firstSaved.savedAt).toBe(24 * 60 * 60 * 1000);

  await page.reload();
  await expect(page.getByText(restoredMessage, { exact: true })).toBeVisible();
  await expectProfileFields(page);
  await expect(page.locator(".reading-result")).toHaveCount(0);

  await page.goto("/readings/mbti");
  await expectProfileFields(page);
  await expect(page.getByLabel("알고 있는 MBTI 유형")).toHaveValue("");
  await page.getByLabel("알고 있는 MBTI 유형").selectOption("INFP");
  const mbti = await submitFreeReport(page);
  expect(mbti).toMatchObject({ theme: "mbti", mbti: "INFP", focus: null });

  await page.goto("/readings/love");
  await expectProfileFields(page);
  await expect(page.getByLabel("알고 있는 MBTI 유형")).toHaveCount(0);
  await page.getByRole("button", { name: /마음을 전하는 말/ }).click();
  const love = await submitFreeReport(page);
  expect(love).toMatchObject({
    theme: "love",
    mbti: null,
    focus: "expression",
  });
  expect((await storedProfile(page)).profile).toEqual({
    ...profile,
    mbti: "INFP",
  });

  await page.goto("/readings/mbti");
  await expectProfileFields(page);
  await expect(page.getByLabel("알고 있는 MBTI 유형")).toHaveValue("INFP");
  await page.screenshot({
    path: testInfo.outputPath("shared-profile-restored.png"),
    fullPage: true,
  });
  await page.goto("/readings/love");
  await expect(
    page.getByRole("button", { name: /마음을 전하는 말/ }),
  ).toHaveAttribute("aria-pressed", "false");
  expect(errors).toEqual([]);
});

test("opting out immediately removes a saved profile and prevents resaving", async ({
  page,
}) => {
  await page.goto("/readings/traditional");
  await fillProfile(page);
  await submitFreeReport(page);
  await page.goto("/readings/mbti");
  await expect(page.getByText(restoredMessage, { exact: true })).toBeVisible();
  await page.getByLabel(rememberLabel).uncheck();
  expect(await storedProfile(page)).toBeNull();
  await expectProfileFields(page);
  await page.getByLabel("알고 있는 MBTI 유형").selectOption("INFP");
  await submitFreeReport(page);
  expect(await storedProfile(page)).toBeNull();
  await page.reload();
  await expect(page.getByLabel("별명")).toHaveValue("");
  await expect(page.getByLabel("태어난 날짜")).toHaveValue("");
  await expect(page.getByText(restoredMessage, { exact: true })).toHaveCount(0);
});

test("the saved-profile delete control removes the record before another product opens", async ({
  page,
}) => {
  await page.goto("/readings/traditional");
  await fillProfile(page);
  await submitFreeReport(page);
  await page.reload();
  await page
    .getByRole("button", { name: "저장된 정보 삭제", exact: true })
    .click();
  expect(await storedProfile(page)).toBeNull();
  await page.goto("/readings/mbti");
  await expect(page.getByLabel("별명")).toHaveValue("");
  await expect(page.getByLabel("태어난 날짜")).toHaveValue("");
  await expect(page.getByLabel("알고 있는 MBTI 유형")).toHaveValue("");
  await expect(page.getByText(restoredMessage, { exact: true })).toHaveCount(0);
});

for (const invalid of ["expired", "malformed"] as const) {
  test(`${invalid} storage is discarded without restoring personal fields`, async ({
    page,
  }) => {
    await page.goto("/");
    await page.evaluate(
      ({ key, profile, invalid }) => {
        const expiresAt = Date.now() - 1000;
        localStorage.setItem(
          key,
          invalid === "malformed"
            ? "{broken-json"
            : JSON.stringify({
                version: 1,
                savedAt: expiresAt - 24 * 60 * 60 * 1000,
                expiresAt,
                profile,
              }),
        );
      },
      { key: profileKey, profile, invalid },
    );
    await page.goto("/readings/mbti");
    await expect(page.getByLabel("별명")).toHaveValue("");
    await expect(page.getByLabel("태어난 날짜")).toHaveValue("");
    await expect(page.getByText(restoredMessage, { exact: true })).toHaveCount(
      0,
    );
    await expect.poll(() => storedProfile(page)).toBeNull();
  });
}

test("blocked local storage still allows a normal free reading", async ({
  page,
}) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, "localStorage", {
      configurable: true,
      get() {
        throw new DOMException(
          "Storage is blocked by browser policy",
          "SecurityError",
        );
      },
    });
  });
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/readings/traditional");
  await fillProfile(page);
  await submitFreeReport(page);
  expect(errors).toEqual([]);
});
