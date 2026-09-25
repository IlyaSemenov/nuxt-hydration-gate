import { defineNuxtPlugin } from "#app"

import { hydrationGateAttribute } from "./config"

export default defineNuxtPlugin({
  name: "nuxt-hydration-gate",
  setup(nuxtApp) {
    // Nuxt also mounts its error page through app:mounted, including after a plugin error.
    nuxtApp.hook("app:mounted", () => {
      document.documentElement.setAttribute(hydrationGateAttribute, "")
    })
  },
})
