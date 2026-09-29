import { defineConfig, devices } from '@playwright/test';

/**
 * Website e2e (D-067). Every spec mocks the API (e2e/fixtures/api-mock.ts):
 * the dev database rarely holds the states a screen needs, and a learner must
 * never be signed in with real credentials. Backend rules are covered by the
 * Laravel feature tests; these specs check the screens at 375 / 768 / 1440
 * in English and Arabic.
 */
const PORT = 4400; // 4200 and 4300 are taken by Dashboard dev servers on this machine

export default defineConfig({
  testDir: './e2e',
  outputDir: './test-results',
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  workers: 1,
  retries: 0,
  forbidOnly: !!process.env['CI'],
  reporter: [['list']],

  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: 'retain-on-failure',
    screenshot: 'off',
    reducedMotion: 'reduce',
  },

  projects: [
    { name: 'mobile-375', use: { ...devices['Desktop Chrome'], viewport: { width: 375, height: 812 } } },
    { name: 'tablet-768', use: { ...devices['Desktop Chrome'], viewport: { width: 768, height: 1024 } } },
    { name: 'desktop-1440', use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } } },
  ],

  webServer: {
    command: `npx ng serve --port ${PORT}`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: true,
    timeout: 180_000,
  },
});
