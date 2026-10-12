import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  fullyParallel: false,
  workers: 1,
  use: { baseURL: 'http://localhost:4200', trace: 'retain-on-failure', channel: 'chrome' },
  reporter: [['list']],
});
