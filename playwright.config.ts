import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/browser',
  workers: 1,
  fullyParallel: false,
  retries: 0,
  use: {
    baseURL: 'http://localhost:3003',
    viewport: { width: 1440, height: 1000 },
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  webServer: {
    command: 'node tests/browser/server.mjs',
    url: 'http://localhost:3003/api/health/ready',
    reuseExistingServer: false,
    timeout: 30000,
  },
});
