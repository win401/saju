import { test, expect, type Page, type Route } from "@playwright/test";
import {
  aiLoveReadingSchema,
  type LoveConsultationResponse,
} from "../src/features/relationship/ai-contract";

// Synthetic fixtures only. Every AI request is intercepted before reaching the
// local server; the existing chart preview still uses its real local endpoint.
const accessCode = "fixture-owner-code";
const question =
  "연락하는 속도가 서로 달라요. 제 마음을 어떻게 전하면 좋을까요?";
const birthInput = {
  nickname: "상담테스터",
  gender: "female",
  birthDate: "2000-01-07",
  calendar: "solar",
  leapMonth: false,
  birthTime: "12:00",
  mbti: null,
  location: "KR",
  theme: "love",
  focus: null,
};
const literalMarkup = '<strong data-ai-markup="fixture">테스트 문장</strong>';
const fixture: LoveConsultationResponse = {
  source: "openai",
  reading: aiLoveReadingSchema.parse({
    title: "마음의 속도를 말로 맞춰보기",
    opening: "서로의 연락 주기가 다를 때 건넬 수 있는 말을 함께 생각해볼게요.",
    sections: [
      {
        title: "내 마음을 먼저 살펴봐요",
        paragraphs: ["답장을 기다리는 동안 어떤 감정이 드는지 적어보세요."],
        evidenceIds: ["day-stem"],
      },
      {
        title: "상대에게 확인해볼 이야기",
        paragraphs: [
          "연락하기 편한 시간을 직접 물어볼 수 있어요.",
          literalMarkup,
        ],
        evidenceIds: ["month-branch"],
      },
      {
        title: "오늘 해볼 작은 대화",
        paragraphs: [
          "답장이 늦으면 걱정된다고 말한 뒤, 편한 연락 주기를 함께 정해보세요.",
        ],
        evidenceIds: ["surface-elements"],
      },
    ],
    takeaway:
      "상대의 마음을 단정하기 전에, 내가 바라는 연락 방식을 구체적으로 전해보세요.",
    nextQuestion: "최근 연락을 기다리며 가장 걱정됐던 순간은 언제였나요?",
  }),
  evidence: [
    {
      id: "day-stem",
      label: "일간",
      detail: "갑목 일간을 참고한 테스트 근거입니다.",
    },
    {
      id: "month-branch",
      label: "월지",
      detail: "월지 축의 상징을 참고한 테스트 근거입니다.",
    },
    {
      id: "surface-elements",
      label: "표면 오행",
      detail: "표면 오행 구성을 참고한 테스트 근거입니다.",
    },
  ],
  limitation: "이 답변은 화면 검증용 합성 예시이며 실제 상담 결과가 아닙니다.",
};

async function mockAi(
  page: Page,
  available: boolean,
  onPost: (route: Route) => Promise<void>,
) {
  await page.route("**/api/ai/love", async (route) => {
    if (route.request().method() === "GET") {
      await route.fulfill({
        json: { available, requiresAccessCode: available },
      });
      return;
    }
    if (route.request().method() === "POST") {
      await onPost(route);
      return;
    }
    await route.fulfill({
      status: 405,
      json: { error: "Test method not allowed" },
    });
  });
}

async function openLovePreview(page: Page, openLive = true) {
  await page.goto("/readings/love");
  const nickname = page.getByLabel("별명");
  // The fieldset enables only after hydration and profile restoration finish.
  await expect(nickname).toBeEnabled();
  await nickname.fill(birthInput.nickname);
  await page.getByText("여성", { exact: true }).click();
  await page.getByLabel("태어난 날짜").fill(birthInput.birthDate);
  await page
    .getByLabel("태어난 시간", { exact: true })
    .fill(birthInput.birthTime);
  await expect(nickname).toHaveValue(birthInput.nickname);
  const preview = page.waitForResponse(
    (response) =>
      new URL(response.url()).pathname === "/api/reports" &&
      response.request().method() === "POST",
  );
  await page.getByRole("button", { name: "나의 무료 요약 읽기" }).click();
  expect((await preview).status()).toBe(200);
  await expect(
    page.locator(".reading-prose .narrative-section").first(),
  ).toBeVisible();
  const liveAccess = page.locator(".ai-love-live-access > summary");
  if (openLive && (await liveAccess.count())) await liveAccess.click();
}

test("AI unavailable is explicit while the regular love report remains usable", async ({
  page,
}, testInfo) => {
  let aiPosts = 0;
  await mockAi(page, false, async (route) => {
    aiPosts++;
    await route.fulfill({
      status: 503,
      json: { error: "Unavailable fixture" },
    });
  });
  await openLovePreview(page);
  const ai = page.locator(".ai-love:not(.ai-love--sample)");
  await expect(
    ai.getByRole("heading", { name: "여울의 AI 상담 준비 중" }),
  ).toBeVisible();
  await expect(ai.getByRole("status")).toContainText(
    "지금은 아래 연애 리포트를 읽을 수 있어요",
  );
  await expect(ai.locator("form")).toHaveCount(0);
  await ai.screenshot({
    path: testInfo.outputPath("ai-love-unavailable.png"),
    animations: "disabled",
    scale: "css",
  });
  const publicFullReading = page.getByRole("button", {
    name: "전체 리포트 무료로 읽기",
  });
  if (await publicFullReading.count()) {
    await publicFullReading.click();
  } else {
    await page.getByRole("button", { name: "전체 리포트 체험" }).click();
    await page.getByLabel("실제 결제가 아닌 체험임을 확인했어요.").check();
    await page.getByRole("button", { name: "0원으로 전체 체험하기" }).click();
  }
  await expect(page.locator(".chapter-reader h3")).toBeVisible();
  await expect(page.locator(".chapter-progress button")).toHaveCount(4);
  expect(aiPosts).toBe(0);
});

test("owner code and consent submit one request, lock loading controls, and render plain-text AI sections", async ({
  page,
}, testInfo) => {
  const posts: unknown[] = [];
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  let finishResponse = () => {};
  const responseReady = new Promise<void>((resolve) => {
    finishResponse = resolve;
  });
  await mockAi(page, true, async (route) => {
    posts.push(route.request().postDataJSON());
    await responseReady;
    await route.fulfill({ json: fixture });
  });
  try {
    await openLovePreview(page);
    const ai = page.locator(".ai-love:not(.ai-love--sample)");
    const questionInput = ai.getByLabel("여울에게 묻고 싶은 이야기");
    const codeInput = ai.getByLabel("체험 코드");
    const consent = ai.getByLabel("AI 상담에 필요한 정보 전송에 동의해요.");
    await expect(
      ai.getByRole("heading", { name: "지금, 마음에 걸리는 게 있나요?" }),
    ).toBeVisible();
    await expect(codeInput).toHaveAttribute("type", "password");
    await ai.getByLabel("마음에 둔 사람이 있어요").check();
    await questionInput.fill(question);
    await codeInput.fill(`  ${accessCode}  `);
    await ai.getByRole("button", { name: "여울에게 내 마음 묻기" }).click();
    expect(posts).toEqual([]);
    await expect(consent).not.toBeChecked();

    await consent.check();
    await ai.getByRole("button", { name: "여울에게 내 마음 묻기" }).click();
    await expect.poll(() => posts.length).toBe(1);
    await expect(ai.locator("form")).toHaveAttribute("aria-busy", "true");
    await expect(questionInput).toBeDisabled();
    await expect(codeInput).toBeDisabled();
    await expect(consent).toBeDisabled();
    await expect(ai.getByLabel("마음에 둔 사람이 있어요")).toBeDisabled();
    await expect(
      ai.getByRole("button", { name: "여울이 이야기를 읽고 있어요" }),
    ).toBeDisabled();
    expect(posts[0]).toEqual({
      input: birthInput,
      situation: { status: "talking", question },
      consent: true,
      accessCode,
    });
    finishResponse();

    await expect(ai.getByTestId("ai-love-result")).toBeVisible();
    await expect(ai.locator(".ai-love-answer-section")).toHaveCount(3);
    await expect(
      ai.getByRole("heading", { name: fixture.reading.title }),
    ).toBeVisible();
    await expect(ai.getByText(literalMarkup, { exact: true })).toBeVisible();
    await expect(ai.locator("[data-ai-markup]")).toHaveCount(0);
    await expect(ai.locator(".ai-love-limitation")).toHaveText(
      fixture.limitation,
    );
    await ai.getByText("어떤 사주 정보를 참고했나요?", { exact: true }).click();
    await expect(ai.locator(".ai-love-evidence li")).toHaveCount(3);
    for (const evidence of fixture.evidence)
      await expect(
        ai.getByText(evidence.detail, { exact: true }),
      ).toBeVisible();
    await ai.screenshot({
      path: testInfo.outputPath("ai-love-answer.png"),
      animations: "disabled",
      scale: "css",
    });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    expect(posts).toHaveLength(1);

    await ai.getByRole("button", { name: "다른 고민 물어보기" }).click();
    await expect(questionInput).toHaveValue("");
    await expect(consent).not.toBeChecked();
    await expect(ai.getByTestId("ai-love-result")).toHaveCount(0);
    await expect(ai.locator(".ai-love-new-question")).toContainText(
      "앞선 대화는 전송하지 않고",
    );
    await questionInput.fill("서로 편한 연락 시간을 어떻게 정하면 좋을까요?");
    await ai.getByRole("button", { name: "여울에게 내 마음 묻기" }).click();
    await expect(consent).not.toBeChecked();
    expect(posts).toHaveLength(1);
    expect(errors).toEqual([]);
  } finally {
    finishResponse();
  }
});

test("a 502 response keeps question, code and consent until explicit retry succeeds", async ({
  page,
}, testInfo) => {
  const posts: unknown[] = [];
  const error =
    "지금은 AI 답변을 완성하지 못했어요. 입력을 유지했으니 잠시 후 다시 시도해주세요.";
  await mockAi(page, true, async (route) => {
    posts.push(route.request().postDataJSON());
    await route.fulfill(
      posts.length === 1 ? { status: 502, json: { error } } : { json: fixture },
    );
  });
  await openLovePreview(page);
  const ai = page.locator(".ai-love:not(.ai-love--sample)");
  const questionInput = ai.getByLabel("여울에게 묻고 싶은 이야기");
  const codeInput = ai.getByLabel("체험 코드");
  const consent = ai.getByLabel("AI 상담에 필요한 정보 전송에 동의해요.");
  await questionInput.fill(question);
  await codeInput.fill(accessCode);
  await consent.check();
  await ai.getByRole("button", { name: "여울에게 내 마음 묻기" }).click();
  await expect(ai.getByRole("alert")).toHaveText(error);
  await expect(questionInput).toHaveValue(question);
  await expect(codeInput).toHaveValue(accessCode);
  await expect(consent).toBeChecked();
  await expect(
    ai.getByRole("button", { name: "상담 다시 요청하기" }),
  ).toBeEnabled();
  await expect(ai.getByTestId("ai-love-result")).toHaveCount(0);
  expect(posts).toHaveLength(1);
  await ai.screenshot({
    path: testInfo.outputPath("ai-love-retry.png"),
    animations: "disabled",
    scale: "css",
  });
  await ai.getByRole("button", { name: "상담 다시 요청하기" }).click();
  await expect(ai.getByTestId("ai-love-result")).toBeVisible();
  expect(posts).toHaveLength(2);
  expect(posts[1]).toEqual(posts[0]);
  await expect(ai.getByRole("alert")).toHaveCount(0);
});

test("public consultation sample needs no AI request and survives unavailable live status", async ({
  page,
}) => {
  const requests: string[] = [];
  await page.route("**/api/ai/love", async (route) => {
    requests.push(route.request().method());
    await route.fulfill({
      status: 503,
      json: { error: "Unavailable fixture" },
    });
  });
  await openLovePreview(page, false);
  const sample = page.locator(".ai-love--sample");
  test.skip(!(await sample.count()), "Requires SAJU_PUBLIC_DEMO=1");
  await expect(sample).toContainText("실시간 AI 응답이 아니며");
  await sample.getByText("상담 예시 읽기", { exact: true }).click();
  await expect(sample.getByTestId("love-consultation-example")).toBeVisible();
  await expect(
    sample.getByRole("heading", {
      name: "답장의 온도보다, 함께 내는 시간을 봐요",
    }),
  ).toBeVisible();
  expect(requests).toEqual([]);

  await page.locator(".ai-love-live-access > summary").click();
  await expect(page.locator(".ai-love--quiet")).toContainText(
    "상담실 연결을 확인하지 못했어요",
  );
  await expect(sample.getByTestId("love-consultation-example")).toBeVisible();
  // Development StrictMode can run the mounted availability effect twice.
  expect(requests.length).toBeGreaterThanOrEqual(1);
  expect(requests.every((method) => method === "GET")).toBe(true);
  await expect(sample.locator("input, textarea")).toHaveCount(0);
});
