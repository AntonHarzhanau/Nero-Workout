import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",

  workers: 1,
  timeout: 60_000,
  globalTimeout: 5 * 60_000,
  forbidOnly: Boolean(process.env.CI),

  reporter: [
    ["list"],
    ["html", { open: "never" }],
  ],

  use: {
    baseURL: process.env.BASE_URL ?? "http://localhost:3000",
    browserName: "chromium",
    viewport: { width: 1440, height: 1000 },
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
  },
});
