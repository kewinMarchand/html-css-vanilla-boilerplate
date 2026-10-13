import { defineConfig, devices } from '@playwright/test'

const PORT = 3130
const BASE_URL = `http://localhost:${PORT}`

// Second serveur avec des valeurs factices pour tests/e2e/observability.e2e.js : aucun traceur réel.
export const OBSERVABILITY_PORT = 3133
const OBSERVABILITY_ENV = {
  GLITCHTIP_DSN: 'http://cle@localhost:3231/1',
  GLITCHTIP_ENVIRONMENT: 'test',
  MATOMO_URL: 'http://matomo.test/',
  MATOMO_SITE_ID: '1',
}

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
  webServer: [
    {
      command: `node scripts/serve.js ${PORT}`,
      url: BASE_URL,
      reuseExistingServer: !process.env.CI,
    },
    {
      command: `node scripts/serve.js ${OBSERVABILITY_PORT}`,
      url: `http://localhost:${OBSERVABILITY_PORT}`,
      reuseExistingServer: !process.env.CI,
      env: OBSERVABILITY_ENV,
    },
  ],
})
