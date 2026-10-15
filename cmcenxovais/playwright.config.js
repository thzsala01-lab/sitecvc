import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./tests",
  testMatch: "browser-3d.spec.js",
  workers: 1,
  timeout: 150000,
  expect: { timeout: 45000 },
  reporter: "list",
  use: {
    baseURL: "http://127.0.0.1:4180",
    viewport: { width: 1280, height: 900 },
    launchOptions: {
      executablePath:
        process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || undefined,
      args: ["--enable-unsafe-swiftshader"],
    },
    screenshot: "only-on-failure",
  },
  webServer: {
    command: process.env.PLAYWRIGHT_USE_PREVIEW
      ? "node node_modules/vite/bin/vite.js preview --host 127.0.0.1 --port 4180 --strictPort"
      : "node node_modules/vite/bin/vite.js --host 127.0.0.1 --port 4180 --strictPort",
    url: "http://127.0.0.1:4180",
    reuseExistingServer: false,
  },
});
