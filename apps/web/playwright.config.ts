import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { defineConfig } from '@playwright/test';

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  forbidOnly: true,
  retries: 0,
  workers: 1,
  reporter: 'list',
  use: {
    baseURL: 'http://127.0.0.1:5173',
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
  },
  projects: [
    {
      name: 'desktop-chromium',
      use: { browserName: 'chromium', viewport: { width: 1440, height: 1000 } },
    },
    {
      name: 'pixel-6',
      use: {
        browserName: 'chromium',
        deviceScaleFactor: 2.625,
        hasTouch: true,
        isMobile: true,
        viewport: { width: 412, height: 915 },
      },
    },
  ],
  webServer: [
    {
      command: 'pnpm --filter @daily-forge/api start',
      cwd: repositoryRoot,
      reuseExistingServer: true,
      timeout: 30_000,
      url: 'http://127.0.0.1:3000/api/v1/health',
    },
    {
      command: 'pnpm --filter @daily-forge/web dev',
      cwd: repositoryRoot,
      reuseExistingServer: true,
      timeout: 30_000,
      url: 'http://127.0.0.1:5173',
    },
  ],
});
