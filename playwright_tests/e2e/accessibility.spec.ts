import { expect, test } from '@playwright/test'

import expectNoAccessibilityViolations from '../support/accessibility'
import { goToCasesPage, mockMapAssets, signIn, stubCommonApis, stubLocationResults } from '../support/setup'

test.describe('Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    await stubCommonApis()
    await mockMapAssets(page)
  })

  test('home page has no detectable accessibility violations', async ({ page }) => {
    await signIn(page)

    await expectNoAccessibilityViolations(page)
  })

  test('cases overview has no detectable accessibility violations', async ({ page }) => {
    await signIn(page)
    await goToCasesPage(page)

    await expectNoAccessibilityViolations(page)
  })

  test('location activity page has no detectable accessibility violations', async ({ page }) => {
    await signIn(page)
    await goToCasesPage(page)

    await page.locator('[data-qa=cases-sub-navigation]').getByRole('link', { name: 'GPS data' }).click()
    await expect(page.getByRole('heading', { name: 'GPS data' })).toBeVisible()

    await expectNoAccessibilityViolations(page)
  })

  test('location activity map exposes screen reader controls', async ({ page }) => {
    await stubLocationResults()
    await signIn(page)
    await goToCasesPage(page)

    await page.locator('[data-qa=cases-sub-navigation]').getByRole('link', { name: 'GPS data' }).click()
    await page.locator('#crn').fill('X123456')
    await page.locator('#start-date').fill('01/01/2026')
    await page.locator('#start-hour').fill('10')
    await page.locator('#start-minute').fill('00')
    await page.locator('#end-date').fill('02/01/2026')
    await page.locator('#end-hour').fill('15')
    await page.locator('#end-minute').fill('30')
    await page.getByRole('button', { name: 'Update map' }).click()

    const map = page.locator('[data-qa=em-map]')
    await expect(map).toHaveAttribute('role', 'region')
    await expect(map).toHaveAttribute('aria-label', 'Interactive map')
    await expect(map).toHaveAttribute('aria-describedby', 'map-instructions')
    await expect(page.locator('#map-instructions')).not.toBeEmpty()
    await expect(page.locator('#map-pan-announce')).toHaveAttribute('aria-live', 'polite')
    await expect(page.locator('#map-pan-announce')).toHaveAttribute('aria-atomic', 'true')
    await expect(page.locator('#lock-rotation-btn')).toHaveCount(0)
    await expect(page.locator('#map-rotation-status')).toHaveCount(0)

    await expect(page.locator('em-map').locator('.ol-zoom-in')).toHaveAttribute('aria-label', 'Zoom in')
    await expect(page.locator('em-map').locator('.ol-zoom-out')).toHaveAttribute('aria-label', 'Zoom out')

    const dividers = page.locator('.mlc-panel__divider')
    await expect(dividers).toHaveCount(1)
    await expect(dividers.first()).toHaveAttribute('aria-hidden', 'true')

    const closeMapControls = page.getByRole('button', { name: 'Close map controls' })
    await expect(closeMapControls).toHaveAttribute('aria-expanded', 'true')
    await closeMapControls.click()

    const openMapControls = page.getByRole('button', { name: 'Open map controls' })
    await expect(openMapControls).toHaveAttribute('aria-expanded', 'false')
    await openMapControls.click()
    await expect(closeMapControls).toHaveAttribute('aria-expanded', 'true')

    await map.focus()
    await page.keyboard.press('Enter')
    await expect(page.locator('em-map').locator('.app-map__overlay')).toBeVisible()
  })
})
