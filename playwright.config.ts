import { defineConfig } from "@playwright/test"

const fixture = "tests/fixtures/nuxt"

export default defineConfig({
  testDir: "tests",
  use: { baseURL: "http://127.0.0.1:3100" },
  webServer: [
    {
      command: `node ${fixture}/.output/server/index.mjs`,
      url: "http://127.0.0.1:3100",
      env: { HOST: "127.0.0.1", PORT: "3100" },
    },
    {
      command: `node ${fixture}/.output-spa/server/index.mjs`,
      url: "http://127.0.0.1:3101",
      env: { HOST: "127.0.0.1", PORT: "3101" },
    },
  ],
})
