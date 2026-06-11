import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './accessibility_tests/e2e',
  outputDir: './test_results/playwright-accessibility/results',
  fullyParallel: false,
  reporter: [
    ['list'],
    ['junit', { outputFile: './test_results/playwright-accessibility/results.xml' }],
    ['html', { outputFolder: './test_results/playwright-accessibility/html', open: 'never' }],
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
