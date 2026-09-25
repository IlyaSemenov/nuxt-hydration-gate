import {
  test as base,
  type Fixtures,
  type Page,
  type PlaywrightTestArgs,
  type PlaywrightTestOptions,
  type PlaywrightWorkerArgs,
  type PlaywrightWorkerOptions,
  type TestType,
} from "@playwright/test"

import { hydrationGateAttribute } from "./runtime/config"

/** Options for {@link waitForHydration}. */
export interface WaitForHydrationOptions {
  /** Maximum time in milliseconds; defaults to the page's default timeout, which Playwright Test sets from `actionTimeout` and leaves unlimited by default. */
  timeout?: number
}

/**
 * Wait until the Nuxt app on the page is mounted and `<html>` has `data-app-hydrated`.
 *
 * Use it before `page.keyboard`, `page.mouse`, `page.evaluate()`, and other calls that bypass locator actionability checks.
 * Throws if the attribute does not appear in time, for example on a page without the Nuxt module.
 */
export async function waitForHydration(page: Page, options: WaitForHydrationOptions = {}) {
  try {
    await page
      .locator(`html[${hydrationGateAttribute}]`)
      .waitFor({ state: "attached", timeout: options.timeout })
  } catch (error) {
    throw new Error(
      `nuxt-hydration-gate: <html> did not get ${hydrationGateAttribute}; the page is not a Nuxt app with nuxt-hydration-gate, or its client app failed to mount.`,
      { cause: error },
    )
  }
}

/** Fixtures that hold locator actions and auto-waiting assertions until the page's Nuxt app is hydrated. */
export const hydrationGateFixtures: Fixtures<
  { _hydrationGate: void },
  {},
  PlaywrightTestArgs & PlaywrightTestOptions
> = {
  _hydrationGate: [
    async ({ page, javaScriptEnabled }, use) => {
      // Without JavaScript the attribute never appears; test the server-rendered page as is.
      if (javaScriptEnabled !== false) {
        await page.addLocatorHandler(
          page.locator(`html:not([${hydrationGateAttribute}])`),
          // Playwright waits for the locator to stop matching after the handler, within the action's own timeout.
          async () => {},
        )
      }
      await use()
    },
    { auto: true },
  ],
}

/** Playwright `test` extended with {@link hydrationGateFixtures}. */
// Annotated so declarations reference @playwright/test rather than its transitive playwright package.
export const test: TestType<
  PlaywrightTestArgs & PlaywrightTestOptions & { _hydrationGate: void },
  PlaywrightWorkerArgs & PlaywrightWorkerOptions
> = base.extend(hydrationGateFixtures)
