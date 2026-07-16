import { defineConfig, devices } from '@playwright/test';

// E2E config for the QCR Workbench SPA. The vault's encryption key lives in a
// module-level variable, so a full page reload re-locks it — tests must
// navigate client-side (click stepper/sidebar links), never page.goto()
// between steps. Serial, single worker: the flow builds one vault of state.
export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: 'list',
  timeout: 90_000,
  use: {
    // Dedicated port + strictPort so the suite always drives THIS app and can
    // never accidentally reuse a sibling dev server (e.g. the donor repo) that
    // happens to hold the default 5173.
    baseURL: 'http://localhost:5289',
    trace: 'on-first-retry',
  },
  webServer: {
    command: 'npm run dev -- --port 5289 --strictPort',
    url: 'http://localhost:5289',
    reuseExistingServer: false,
    timeout: 120_000,
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
