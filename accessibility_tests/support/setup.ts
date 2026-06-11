import { expect, type Page } from '@playwright/test'

import auth from '../../integration_tests/mockApis/auth'
import emdiApi from '../../integration_tests/mockApis/emdiApi'
import locationActivity from '../../integration_tests/mockApis/locationActivity'
import { resetStubs } from '../../integration_tests/mockApis/wiremock'
import vectorStyle from '../../integration_tests/fixtures/vectorStyle.json'

export const stubCommonApis = async (): Promise<void> => {
  await resetStubs()
  await auth.stubSignIn()
  await emdiApi.stubExampleTime()
}

export const signIn = async (page: Page): Promise<void> => {
  await page.goto('/')
  const signInUrl = await auth.getSignInUrl()

  await page.goto(signInUrl)
  await expect(page.getByRole('heading', { name: 'This site is under construction...' })).toBeVisible()
}

export const goToCasesPage = async (page: Page): Promise<void> => {
  await page.locator('[data-qa=primary-navigation]').getByRole('link', { name: 'Cases' }).click()
  await expect(page.getByRole('heading', { name: 'Adam Collins' })).toBeVisible()
}

export const mockMapAssets = async (page: Page): Promise<void> => {
  await page.route('**/os-map/vector/style', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      json: vectorStyle,
    })
  })

  await page.route('**/os-map/vector/tiles/**', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/x-protobuf',
      body: '',
    })
  })
}

export const stubLocationResults = async (): Promise<void> => {
  await locationActivity.stubGetLocations({
    crn: 'X123456',
    locations: [
      {
        positionId: 1,
        timestamp: '2026-01-01T12:00:00Z',
        latitude: 51.5074,
        longitude: -0.1278,
        precision: 5,
        speed: 0,
        direction: 0,
        geolocationMechanism: 'GPS',
        sequenceNumber: 1,
      },
    ],
  })
}
