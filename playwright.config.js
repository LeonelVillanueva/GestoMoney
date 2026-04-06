import { defineConfig, devices } from '@playwright/test'

/**
 * Requiere `.env` con Supabase (mismo que en desarrollo) para que Vite arranque.
 * @see e2e/README.md
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: 'http://127.0.0.1:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    locale: 'es-ES'
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'npm run dev',
    url: 'http://127.0.0.1:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
    stdout: 'pipe',
    stderr: 'pipe'
  }
})
