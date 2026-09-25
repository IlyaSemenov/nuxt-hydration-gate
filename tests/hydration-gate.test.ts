import { expect, test as base } from "@playwright/test"
import type { Page } from "@playwright/test"
import { hydrationGateFixtures, test, waitForHydration } from "nuxt-hydration-gate/playwright"

const html = (page: Page) => page.locator("html")

/** Hold the client JavaScript so the server-rendered page stays interactive before hydration. */
async function delayClient(page: Page) {
  await page.route("**/_nuxt/**/*.js", async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 2000))
    await route.continue()
  })
}

test.describe("marker", () => {
  test("is set after mount and kept after client navigation", async ({ page }) => {
    await page.goto("/")
    await waitForHydration(page)
    await page.getByRole("link", { name: "Other" }).click()
    await expect(page.getByText("Other page")).toBeVisible()
    await expect(html(page)).toHaveAttribute("data-app-hydrated", "")
  })

  test("is absent from server-rendered HTML", async ({ request }) => {
    const response = await request.get("/")
    expect(await response.text()).not.toContain("data-app-hydrated")
  })

  test("is set on the Nuxt error page", async ({ page }) => {
    await page.goto("/missing")
    await waitForHydration(page)
  })

  test("is set on the Nuxt error page after a client plugin error", async ({ page }) => {
    await page.goto("/?fail-plugin")
    await waitForHydration(page)
    await expect(page.getByText("Plugin failed")).toBeVisible()
  })

  test("is set in SPA mode", async ({ page }) => {
    await page.goto("http://127.0.0.1:3101/")
    await waitForHydration(page)
    await expect(page.getByRole("button", { name: "Send" })).toBeVisible()
  })
})

test.describe("without JavaScript", () => {
  test.use({ javaScriptEnabled: false })

  test("fixture skips the wait", async ({ page }) => {
    await page.goto("/")
    await page.getByLabel("Name").fill("Alice")
    await expect(html(page)).not.toHaveAttribute("data-app-hydrated")
  })
})

test.describe("fixture", () => {
  test("holds locator actions until hydration", async ({ page }) => {
    await delayClient(page)
    await page.goto("/", { waitUntil: "commit" })
    await page.getByLabel("Name").fill("Alice")
    await page.getByRole("button", { name: "Send" }).click()
    await expect(page.locator("#result")).toHaveText("Hello, Alice")
    expect(page.url()).not.toContain("name=")
  })

  test("fails the action with a clear error when the app never mounts", async ({ page }) => {
    await page.route("**/_nuxt/**/*.js", (route) => route.abort())
    await page.goto("/")
    await expect(page.getByLabel("Name").fill("Alice", { timeout: 2000 })).rejects.toThrow(
      /html:not\(\[data-app-hydrated\]\)/,
    )
  })
})

base.describe("without fixture", () => {
  // Regression: proves that the fixture is needed.
  base("form is submitted natively before hydration", async ({ page }) => {
    await delayClient(page)
    await page.goto("/", { waitUntil: "commit" })
    await page.getByLabel("Name").fill("Alice")
    await page.getByRole("button", { name: "Send" }).click()
    await expect(page).toHaveURL(/name=Alice/)
  })

  base("README recipe makes the form inert before hydration", async ({ page }) => {
    await delayClient(page)
    await page.goto("/inert", { waitUntil: "commit" })
    const input = page.getByLabel("Name")
    const focus = () =>
      input.evaluate((el: HTMLElement) => (el.focus(), document.activeElement === el))
    base.skip(
      !(await page.evaluate(() => CSS.supports("interactivity", "inert"))),
      "no interactivity support",
    )
    expect(await focus()).toBe(false)
    await waitForHydration(page)
    expect(await focus()).toBe(true)
  })
})

const composed = base
  .extend<{ greeting: string }>({ greeting: "Hello" })
  .extend(hydrationGateFixtures)

composed("composition keeps project fixtures", async ({ page, greeting }) => {
  await delayClient(page)
  await page.goto("/", { waitUntil: "commit" })
  await page.getByLabel("Name").fill("Alice")
  await page.getByRole("button", { name: "Send" }).click()
  await expect(page.locator("#result")).toHaveText(`${greeting}, Alice`)
})
