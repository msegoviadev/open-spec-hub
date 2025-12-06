import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright configuration for API Docs Platform E2E tests
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './tests/e2e',

  // Maximum time one test can run for
  timeout: 30 * 1000,

  // Test artifacts
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,

  // Reporter configuration
  reporter: 'html',

  // Shared settings for all tests
  use: {
    // Base URL for navigation
    baseURL: 'http://localhost:3000/open-spec-hub/demo/',

    // Collect trace when retrying failed test
    trace: 'on-first-retry',

    // Screenshots on failure
    screenshot: 'only-on-failure',
  },

  // Configure projects for different browsers
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  // Run dev server before tests (optional)
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000/open-spec-hub/demo/',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
});
