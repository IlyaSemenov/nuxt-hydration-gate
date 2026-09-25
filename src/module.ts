import { addPlugin, createResolver, defineNuxtModule } from "@nuxt/kit"

/** Mark `<html>` with `data-app-hydrated` after the root Nuxt app is mounted in the browser. */
export default defineNuxtModule({
  meta: {
    name: "nuxt-hydration-gate",
    compatibility: { nuxt: "^3.0.0 || ^4.0.0" },
  },
  setup() {
    const { resolve } = createResolver(import.meta.url)
    addPlugin(resolve("./runtime/plugin.client"))
  },
})
