import { defineBuildConfig } from "unbuild"

// The Playwright entry is not a Nuxt runtime file, so bundle it separately from src/runtime.
export default defineBuildConfig({
  entries: ["src/playwright"],
  externals: ["@playwright/test", /^playwright(-core)?(\/|$)/],
})
