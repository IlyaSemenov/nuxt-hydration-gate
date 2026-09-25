# nuxt-hydration-gate

Mark the moment the Nuxt root app has mounted with the `data-app-hydrated` attribute on `<html>`.

A server-rendered page is visible and accepts input before Vue attaches its event handlers.
A user on a slow connection can fill in and submit a form before hydration, and the browser then submits it natively, bypassing the app's handlers.

This package provides a single public signal, "the root app is mounted", that anything can observe:

- your app's CSS can block interaction until the signal, with a blocking policy you choose;
- scripts and monitoring can wait for `html[data-app-hydrated]`.

The package itself blocks nothing.

The signal is especially useful for end-to-end tests.
Browser automation acts as soon as elements are actionable, which is often before the app's event handlers are attached, so tests click buttons and fill in forms that the app never observes and fail intermittently.
The optional [Playwright integration](#playwright) holds test actions until the signal, and other tools can wait for the same attribute.

See [Background](#background) for related issues and alternatives.

## Marker

After the root app is mounted, `<html>` gets the `data-app-hydrated` attribute.

- Server-rendered HTML never contains the attribute.
- A client plugin sets it in the `app:mounted` hook.
- The attribute stays until the page is reloaded; client-side navigation does not touch it.
- With `ssr: false`, the attribute is set the same way, after mount.
- The Nuxt error page gets the attribute too, including when a client plugin throws and Nuxt shows the error page instead of the route.
- If the client app never mounts, for example because its entry chunk fails to load, the attribute never appears.

The marker does not promise that lazy or async components, delayed hydration (`hydrate-on-*`), or code-split chunks mounted later are ready.
`app:mounted` is a root app lifecycle signal; [Nuxt #34652][nuxt-34652] discusses the same limitation.

For code that needs the attribute name programmatically:

```ts
import { hydrationGateAttribute } from "nuxt-hydration-gate/runtime" // "data-app-hydrated"
```

## Install

```sh
npm install nuxt-hydration-gate
```

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ["nuxt-hydration-gate"],
})
```

The module has no options.
It registers only the client plugin, without CSS, components, auto-imports, or runtime config.

## Blocking interaction

Block interaction in your app's CSS, for example make forms inert until hydration:

```css
html:not([data-app-hydrated]) form {
  interactivity: inert;
}
```

The selector is yours to choose: only forms, specific elements such as `.checkout button`, or the whole interactive part of the page such as `#__nuxt`.

As of September 2026, Chrome and Edge support the `interactivity` property since version 135, while Firefox and Safari do not ([Can I use](https://caniuse.com/mdn-css_properties_interactivity)).
Where it is unsupported, the rule does nothing, so it works as progressive enhancement.

## Playwright

The `nuxt-hydration-gate/playwright` entry requires `@playwright/test` 1.44 or newer and does not depend on the Nuxt runtime.

Use the ready `test` with the fixture enabled:

```ts
import { expect } from "@playwright/test"
import { test } from "nuxt-hydration-gate/playwright"
```

Or compose the fixtures with your project's own `test`:

```ts
import { test as base } from "@playwright/test"
import { hydrationGateFixtures } from "nuxt-hydration-gate/playwright"

export const test = base.extend<MyFixtures>({ ...myFixtures }).extend(hydrationGateFixtures)
```

Wait explicitly for flows outside locator actionability:

```ts
import { waitForHydration } from "nuxt-hydration-gate/playwright"

await waitForHydration(page)
await page.keyboard.press("Enter")
```

`waitForHydration(page, { timeout })` waits with the passed `timeout` or the page's default timeout, which Playwright Test sets from `actionTimeout` and leaves unlimited by default, and throws if the attribute does not appear.

`test` is `@playwright/test` `test` extended with `hydrationGateFixtures`.

### Fixture behavior

The fixture registers a [locator handler](https://playwright.dev/docs/api/class-page#page-add-locator-handler) for `html:not([data-app-hydrated])`.
Every locator action and every auto-waiting assertion first waits until the page is hydrated, including after a full page load.

- The wait counts toward the action's own timeout.
  On a page that never gets the attribute, such as a non-Nuxt page or an app that failed to mount, the action times out and its call log says it was waiting for `html:not([data-app-hydrated])` to be hidden.
- With `javaScriptEnabled: false`, the fixture does nothing, and actions run against the server-rendered page.

The fixture does not intercept:

- `page.keyboard.*`
- `page.mouse.*`
- `page.evaluate()`
- navigation such as `page.goto()`

Call `waitForHydration(page)` before them when they must run after hydration.

## Background

This race has been reported in [Nuxt][nuxt-34652], [Vue][vue-14403], and [Playwright][playwright-27759].
The Nuxt issue proposes a hydration readiness signal for E2E tests and shows an `app:mounted` workaround with an `<html>` attribute; this package provides it as a ready module.

Vue now [preserves text typed into `v-model` inputs before hydration][vue-14411], and [other input types][vue-15210] are tracked separately.
That fix keeps input values, but it does not attach submit or click handlers earlier, and it gives scripts and tests no readiness signal.

[`@nuxt/test-utils/playwright`](https://nuxt.com/docs/4.x/getting-started/testing#testing-with-playwright-test-runner) offers `goto(url, { waitUntil: "hydration" })`, which waits once per navigation by polling `useNuxtApp().isHydrating`, and [can time out on Firefox][nuxt-test-utils-1671].
This package instead gates every subsequent locator action on a public DOM marker that non-Playwright consumers can observe too.

[nuxt-34652]: https://github.com/nuxt/nuxt/issues/34652
[nuxt-test-utils-1671]: https://github.com/nuxt/test-utils/issues/1671
[playwright-27759]: https://github.com/microsoft/playwright/issues/27759
[vue-14403]: https://github.com/vuejs/core/issues/14403
[vue-14411]: https://github.com/vuejs/core/pull/14411
[vue-15210]: https://github.com/vuejs/core/issues/15210
