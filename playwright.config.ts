import { defineConfig, devices } from '@playwright/test';

/**
 * `npm run test:e2e` builds, then drives the compiled production server in a real browser, with an in-memory database
 * that starts empty each run. Locally it uses your installed Chrome; CI installs Playwright's Chromium.
 */
const CI = Boolean(process.env.CI);
const PORT = 3100;
const BASE_URL = `http://localhost:${PORT}`;

export default defineConfig({
  testDir: 'e2e',
  fullyParallel: true,
  forbidOnly: CI,
  retries: CI ? 1 : 0,
  // Each test signs up (a deliberately slow password hash) and drives its own browser: two at a time is plenty.
  workers: 2,
  reporter: CI ? [['github'], ['html', { open: 'never' }]] : [['list']],
  timeout: 60_000,
  expect: { timeout: 10_000 },
  use: {
    baseURL: BASE_URL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'], channel: CI ? undefined : 'chrome' } }],
  webServer: {
    command: 'npm start',
    url: `${BASE_URL}/api/system/health`,
    reuseExistingServer: false,
    timeout: 60_000,
    env: {
      PORT: String(PORT),
      // Never your `.env` or its database. (Not empty values: Windows drops empty variables.)
      ENV_FILE: 'none',
      PGLITE_DIR: ':memory:',
      JWT_SECRET: 'e2e-only-secret-not-used-anywhere-else-0123456789',
      LOG_LEVEL: 'warn',
    },
  },
});
