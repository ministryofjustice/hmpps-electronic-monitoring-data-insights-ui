import { AxeBuilder } from '@axe-core/playwright'
import { expect, type Page } from '@playwright/test'

const expectNoAccessibilityViolations = async (page: Page): Promise<void> => {
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice'])
    .analyze()

  expect(results.violations).toEqual([])
}

export default expectNoAccessibilityViolations
