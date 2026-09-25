import { defineBuildConfig } from "unbuild"

// The Playwright entry is not a Nuxt runtime file, so bundle it separately from src/runtime.
// It imports the runtime by package name, because module-builder rewrites relative runtime imports as ../dist/runtime/*.
export default defineBuildConfig({
  entries: ["src/playwright"],
  externals: ["@playwright/test", "nuxt-hydration-gate/runtime", /^playwright(-core)?(\/|$)/],
})
