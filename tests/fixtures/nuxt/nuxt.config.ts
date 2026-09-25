const ssr = !process.env.NUXT_TEST_SPA

export default defineNuxtConfig({
  modules: ["nuxt-hydration-gate"],
  ssr,
  buildDir: ssr ? ".nuxt" : ".nuxt-spa",
  nitro: { output: { dir: ssr ? ".output" : ".output-spa" } },
  devtools: { enabled: false },
  compatibilityDate: "2026-09-23",
})
