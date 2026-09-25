export default defineNuxtPlugin(() => {
  if (location.search.includes("fail-plugin")) throw new Error("Plugin failed")
})
