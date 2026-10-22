import { defineConfig, devices } from "@playwright/test";

/**
 * End-to-end tests drive the real builder in Chromium.
 *
 * PDFs are produced the way a user produces them — the browser printing the
 * paged preview — so these run in Chromium only. `CHROME_PATH` points the
 * suite at an installed Chrome/Chromium instead of Playwright's download.
 * `E2E_BASE_URL` reuses a server you already have running.
 */
const port = Number(process.env.E2E_PORT ?? 3100);
const baseURL = process.env.E2E_BASE_URL ?? `http://localhost:${port}`;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["list"], ["html", { open: "never" }]] : "list",
  timeout: 60_000,
  expect: { timeout: 10_000 },
  use: {
    baseURL,
    trace: "retain-on-failure",
    acceptDownloads: true,
  },
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1440, height: 900 },
        // The full browser, not the headless shell: the shell lays out some
        // webfonts with gaps inside words, which then show up in the PDFs.
        channel: process.env.CHROME_PATH ? undefined : "chromium",
        launchOptions: process.env.CHROME_PATH
          ? { executablePath: process.env.CHROME_PATH }
          : undefined,
      },
    },
  ],
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : {
        // CI tests the production build; locally the dev server is enough.
        command: process.env.CI
          ? `pnpm start --port ${port}`
          : `pnpm dev --port ${port}`,
        url: baseURL,
        reuseExistingServer: !process.env.CI,
        timeout: 180_000,
      },
});
