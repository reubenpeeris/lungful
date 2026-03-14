const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests/e2e',
  use: {
    // Serves index.html directly from the repo root
    baseURL: 'http://localhost:5000',
  },
  // Start a simple static server before running tests
  webServer: {
    command: 'npx serve . -p 5000 -s',
    url: 'http://localhost:5000',
    reuseExistingServer: !process.env.CI,
  },
  projects: [
    { name: 'chromium', use: { browserName: 'chromium' } },
  ],
});
