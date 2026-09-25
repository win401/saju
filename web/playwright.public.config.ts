import { defineConfig, devices } from "@playwright/test";

const target = process.env.PUBLIC_DEMO_URL;
if (!target)
  throw new Error("Set PUBLIC_DEMO_URL to the deployed public demo URL.");
const baseURL = new URL(target).origin;

export default defineConfig({
  testDir: "./tests",
  testMatch: "**/public-demo.spec.ts",
  fullyParallel: false,
  workers: 1,
  timeout: 60000,
  expect: { timeout: 15000 },
  use: {
    baseURL,
    channel: "chrome",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "public-mobile",
      use: { ...devices["iPhone 13"], defaultBrowserType: "chromium" },
    },
    { name: "public-desktop", use: { ...devices["Desktop Chrome"] } },
  ],
});
