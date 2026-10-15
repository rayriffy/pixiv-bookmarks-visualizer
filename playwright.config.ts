import { tmpdir } from "node:os";
import path from "node:path";
import { defineConfig, devices } from "@playwright/test";

const development = process.env.E2E_SERVER === "development";
const port = development ? 4174 : 4173;

export default defineConfig({
    testDir: "./tests/e2e",
    fullyParallel: true,
    forbidOnly: Boolean(process.env.CI),
    retries: process.env.CI ? 1 : 0,
    workers: 2,
    reporter: "list",
    outputDir: path.join(tmpdir(), `pixiv-start-acceptance-${development ? "development" : "production"}`),
    use: {
        baseURL: `http://127.0.0.1:${port}`,
        trace: "retain-on-failure",
        screenshot: "only-on-failure",
    },
    projects: [
        { name: "chromium", use: { ...devices["Desktop Chrome"] } },
        { name: "firefox", use: { ...devices["Desktop Firefox"] } },
        { name: "webkit", use: { ...devices["Desktop Safari"] } },
        { name: "mobile", use: { ...devices["Pixel 7"] } },
    ],
    webServer: {
        command: "bun tests/fixtures/start-server.ts",
        url: `http://127.0.0.1:${port}`,
        env: { E2E_SERVER: development ? "development" : "production", PORT: String(port), HOST: "127.0.0.1" },
        reuseExistingServer: false,
        timeout: 60_000,
        stdout: "ignore",
        stderr: "pipe",
    },
});
