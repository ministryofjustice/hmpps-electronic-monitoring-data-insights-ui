import { expect, test } from '@playwright/test'

import expectNoAccessibilityViolations from '../support/accessibility'
import {
  mockMapAssets,
  openPersonLocations,
  signIn,
  stubCommonApis,
  stubDataFreshness,
  stubLiveLocationResults,
  stubPersonSearch,
} from '../support/setup'

const person = {
  deliusId: 'X123456',
  personId: 'person-123456',
  consumerId: 'consumer-123456',
  fullName: 'Alex Example',
  dateOfBirth: '1980-01-01',
}

test.describe('Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    await stubCommonApis()
    await mockMapAssets(page)
  })

  test('person locations journey has no detectable accessibility violations', async ({ page }) => {
    await stubPersonSearch(person)
    await stubDataFreshness()
    await signIn(page)
    await openPersonLocations(page, person.deliusId)

    await expectNoAccessibilityViolations(page)
  })

  test('map help has no detectable accessibility violations', async ({ page }) => {
    await signIn(page)
    await page.goto('/map-help?returnUrl=%2Fpeople%2FX123456%2Flocations')

    await expectNoAccessibilityViolations(page)
  })

  test('whats-new has no detectable accessibility violations', async ({ page }) => {
    await signIn(page)
    await page.goto('/whats-new?returnUrl=%2Fpeople%2FX123456%2Flocations')

    await expectNoAccessibilityViolations(page)
  })

  test('auth error has no detectable accessibility violations', async ({ page }) => {
    await page.goto('/authError')
    await expectNoAccessibilityViolations(page)
  })

  test('live location map exposes screen reader controls', async ({ page }) => {
    await stubPersonSearch(person)
    await stubDataFreshness()
    await stubLiveLocationResults({
      crn: person.deliusId,
      personId: person.personId,
      locations: [
        {
          positionId: 1,
          deviceId: null,
          gpsDate: '2026-01-01T12:00:00Z',
          speed: 0,
          satellite: null,
          direction: 0,
          precision: 5,
          lbs: 1,
          hdop: null,
          geometry: null,
          latitude: 51.5074,
          longitude: -0.1278,
          tagStatus: null,
        },
      ],
    })
    await signIn(page)
    await openPersonLocations(page, person.deliusId)

    const search = new URLSearchParams({
      'start[date]': '01/01/2026',
      'start[hour]': '10',
      'start[minute]': '00',
      'end[date]': '02/01/2026',
      'end[hour]': '15',
      'end[minute]': '30',
    })
    await page.goto(`/people/${person.deliusId}/locations?${search}`)

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
