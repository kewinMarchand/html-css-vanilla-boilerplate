import { defineConfig, devices } from '@playwright/test'

const PORT = 3130
const BASE_URL = `http://localhost:${PORT}`

export default defineConfig({
  testMatch: /.*\.(e2e|a11y)\.js/,
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: BASE_URL,
    locale: 'fr-FR',
    testIdAttribute: 'data-testid',
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile', use: { ...devices['Pixel 7'] } },
  ],
  webServer: {
    command: `node scripts/serve.js ${PORT}`,
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
  },
})
