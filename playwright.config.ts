import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './playwright_tests/e2e',
  outputDir: './test_results/playwright/results',
  fullyParallel: false,
  workers: 1,
  reporter: [
    ['list'],
    ['junit', { outputFile: './test_results/playwright/results.xml' }],
    ['html', { outputFolder: './test_results/playwright/html', open: 'never' }],
  ],
  use: {
    baseURL: 'http://localhost:3007',
    trace: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
})
