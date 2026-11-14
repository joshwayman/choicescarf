import { defineConfig, devices } from '@playwright/test';

/**
 * Browser flows against the production build (#85; #88 adds more and runs
 * them in CI). `npm run test:e2e` builds, serves the build and runs them.
 * Set PLAYWRIGHT_CHROMIUM to use a Chromium that is already installed.
 */
const executablePath = process.env.PLAYWRIGHT_CHROMIUM;

export default defineConfig({
  testDir: 'tests/e2e',
  fullyParallel: true,
  forbidOnly: process.env.CI !== undefined,
  reporter: process.env.CI !== undefined ? 'github' : 'list',
  use: {
    baseURL: 'http://localhost:4173',
    trace: 'off',
    ...(executablePath ? { launchOptions: { executablePath } } : {}),
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'npm run build && npm run preview -- --port 4173 --strictPort',
    url: 'http://localhost:4173',
    reuseExistingServer: process.env.CI === undefined,
    timeout: 120_000,
    // Placeholder ids, so the build loads analytics and error reporting
    // and the flows can check they never block the app or see the calculation.
    env: {
      VITE_GA4_MEASUREMENT_ID: 'G-E2ETEST',
      VITE_SENTRY_DSN: 'https://public@o0.ingest.sentry.io/0',
    },
  },
});
