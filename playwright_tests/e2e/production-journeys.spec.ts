import { expect, test } from '@playwright/test'

import {
  mockMapAssets,
  openPersonLocations,
  signIn,
  stubCommonApis,
  stubDataFreshness,
  stubLiveLocationResults,
  stubPersonSearch,
} from '../support/setup'

const firstPerson = {
  deliusId: 'X123456',
  personId: 'person-123456',
  consumerId: 'consumer-123456',
  fullName: 'Alex Example',
  dateOfBirth: '1980-01-01',
}

const secondPerson = {
  deliusId: 'X654321',
  personId: 'person-654321',
  consumerId: 'consumer-654321',
  fullName: 'Sam Example',
  dateOfBirth: '1985-02-02',
}

const validSearch = new URLSearchParams({
  'start[date]': '01/01/2026',
  'start[hour]': '10',
  'start[minute]': '00',
  'end[date]': '02/01/2026',
  'end[hour]': '15',
  'end[minute]': '30',
})

test.beforeEach(async () => {
  await stubCommonApis()
  await stubDataFreshness()
})

test('a cold locations URL looks up the person and returns to their locations', async ({ page }) => {
  await stubPersonSearch(firstPerson)
  await signIn(page)

  await page.goto('/people/X123456/locations')

  await expect(page).toHaveURL(/\/people\/X123456\/locations$/)
  await expect(page.locator('[data-map-person-name]')).toHaveText('Alex Example')
  await expect(page.getByRole('heading', { name: 'GPS data' })).toBeVisible()
})

test('the person lookup route honors its same-person locations redirect', async ({ page }) => {
  await stubPersonSearch(firstPerson)
  await signIn(page)

  await page.goto('/people/X123456?redirectTo=%2Fpeople%2FX123456%2Flocations')

  await expect(page).toHaveURL(/\/people\/X123456\/locations$/)
  await expect(page.locator('[data-map-person-name]')).toHaveText('Alex Example')
})

test('person context remains isolated when navigating between CRNs', async ({ page }) => {
  await stubPersonSearch(firstPerson)
  await stubPersonSearch(secondPerson)
  await signIn(page)

  await page.goto('/people/X123456')
  await expect(page.getByRole('heading', { name: 'Alex Example' })).toBeVisible()

  await page.goto('/people/X654321')
  await expect(page.getByRole('heading', { name: 'Sam Example' })).toBeVisible()

  await page.goto('/people/X123456/locations')
  await expect(page.locator('[data-map-person-name]')).toHaveText('Alex Example')

  await page.goto('/people/X654321/locations')
  await expect(page.locator('[data-map-person-name]')).toHaveText('Sam Example')
})

test('the locations search validates dates and displays returned GPS positions', async ({ page }) => {
  await stubPersonSearch(firstPerson)
  await stubLiveLocationResults({
    crn: firstPerson.deliusId,
    personId: firstPerson.personId,
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
  await mockMapAssets(page)
  await signIn(page)
  await openPersonLocations(page, firstPerson.deliusId)

  const invalidSearch = new URLSearchParams(validSearch)
  invalidSearch.set('start[date]', '32/01/2026')
  await page.goto(`/people/${firstPerson.deliusId}/locations?${invalidSearch}`)
  await expect(page.getByText('Enter a correct date')).toBeVisible()

  await page.goto(`/people/${firstPerson.deliusId}/locations?${validSearch}`)

  const map = page.locator('[data-qa=em-map]')
  await expect(map).toHaveAttribute('role', 'region')
  await expect(map).toHaveAttribute('aria-label', 'Interactive map')
  await expect(page.getByRole('button', { name: 'Update map' })).toBeVisible()
})

test('map help and whats-new return to their internal locations URL', async ({ page }) => {
  await signIn(page)

  await page.goto('/map-help?returnUrl=%2Fpeople%2FX123456%2Flocations')
  await expect(page.getByRole('link', { name: 'Back' })).toHaveAttribute('href', '/people/X123456/locations')

  await page.goto('/whats-new?returnUrl=%2Fpeople%2FX123456%2Flocations')
  await expect(page.getByRole('link', { name: 'Back' })).toHaveAttribute('href', '/people/X123456/locations')
})

test('the mixed-case authError URL renders the authentication error page', async ({ page }) => {
  const response = await page.goto('/authError')

  expect(response?.status()).toBe(401)
  await expect(page.getByRole('heading', { name: 'Authorisation Error' })).toBeVisible()
})
