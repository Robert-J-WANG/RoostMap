import { defineConfig, devices } from "@playwright/test";

// Use the deployed URL when CI provides one; otherwise test the local app.
const deployedBaseURL = process.env.PLAYWRIGHT_BASE_URL?.trim();
const localBaseURL = "http://127.0.0.1:5173";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: deployedBaseURL || localBaseURL,
    trace: "retain-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
      },
    },
  ],
  // Azure already serves deployed builds, so only start Vite for local tests.
  webServer: deployedBaseURL
    ? undefined
    : {
        command: "npm run dev -- --host 127.0.0.1",
        url: localBaseURL,
        reuseExistingServer: true,
      },
});
