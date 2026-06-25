import { AxeBuilder } from '@axe-core/playwright'
import { expect, type Page } from '@playwright/test'

const expectNoAccessibilityViolations = async (page: Page): Promise<void> => {
  if ((await page.locator('[data-qa=em-map]').count()) > 0) {
    await page.waitForFunction(() => {
      const map = document.querySelector('em-map') as HTMLElement & { shadowRoot: ShadowRoot | null }
      return map?.shadowRoot?.querySelector('.ol-zoomslider-thumb')?.getAttribute('aria-label') === 'Adjust map zoom'
    })
  }

  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice'])
    .analyze()

  expect(results.violations).toEqual([])
}

export default expectNoAccessibilityViolations
