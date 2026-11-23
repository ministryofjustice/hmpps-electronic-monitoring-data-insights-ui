import { expect, type Page } from '@playwright/test'

import auth from '../../integration_tests/mockApis/auth'
import flipt from '../../integration_tests/mockApis/flipt'
import locationActivity from '../../integration_tests/mockApis/locationActivity'
import { resetStubs, stubFor } from '../../integration_tests/mockApis/wiremock'
import vectorStyle from '../../integration_tests/fixtures/vectorStyle.json'

export const stubCommonApis = async (): Promise<void> => {
  await resetStubs()
  await auth.stubSignIn()
  await flipt.stubFeatureFlags({
    enableHeatmap: true,
    enableExclusionZones: false,
  })
  await stubFor({
    request: {
      method: 'GET',
      urlPattern: '/components/api/components.*',
    },
    response: {
      status: 200,
      headers: {
        'Content-Type': 'application/json;charset=UTF-8',
      },
      jsonBody: {
        header: {
          html: '<header class="probation-common-header govuk-!-display-none-print" role="banner"><a class="probation-common-header__link" href="/">HMPPS</a></header>',
          css: [],
          javascript: [],
        },
        footer: {
          html: '<footer class="govuk-footer" role="contentinfo"></footer>',
          css: [],
          javascript: [],
        },
      },
    },
  })
}

export const signIn = async (page: Page): Promise<void> => {
  await page.goto('/')
  const signInUrl = await auth.getSignInUrl()

  await page.goto(signInUrl)
  await expect(page).toHaveURL(/\/$/)
  await expect(page).toHaveTitle(/Home/)
}

type PersonSearchStub = {
  deliusId: string
  personId: string
  consumerId: string
  fullName: string
  dateOfBirth: string
}

export const stubPersonSearch = ({
  deliusId,
  personId,
  consumerId,
  fullName,
  dateOfBirth,
}: PersonSearchStub): Promise<unknown> =>
  stubFor({
    request: {
      method: 'GET',
      urlPath: '/emdi/people',
      queryParameters: {
        deliusId: { equalTo: deliusId },
      },
    },
    response: {
      status: 200,
      headers: { 'Content-Type': 'application/json;charset=UTF-8' },
      jsonBody: {
        persons: [
          {
            personId,
            consumerId,
            personName: fullName,
            nomisId: null,
            pncId: null,
            deliusId,
            horId: null,
            ceprId: null,
            prisonId: null,
            dob: dateOfBirth,
            zip: null,
            city: null,
            street: null,
          },
        ],
        nextToken: null,
      },
    },
  })

type LocationStub = {
  crn: string
  personId: string
  locations: Array<{
    positionId: number
    deviceId: number | null
    gpsDate: string
    speed: number | null
    satellite: number | null
    direction: number | null
    precision: number | null
    lbs: number | null
    hdop: number | null
    geometry: string | null
    latitude: number
    longitude: number
    tagStatus: string | null
  }>
}

export const stubLiveLocationResults = ({ crn, personId, locations }: LocationStub): Promise<unknown> =>
  stubFor({
    request: {
      method: 'GET',
      urlPattern: `/emdi/people/${personId}/locations.*`,
      queryParameters: {
        crn: { equalTo: crn },
      },
    },
    response: {
      status: 200,
      headers: { 'Content-Type': 'application/json;charset=UTF-8' },
      jsonBody: { locations, nextToken: null },
    },
  })

export const stubDataFreshness = (latestPosition?: string): Promise<unknown> =>
  stubFor({
    request: {
      method: 'GET',
      urlPath: '/emdi/status',
    },
    response: {
      status: 200,
      headers: { 'Content-Type': 'application/json;charset=UTF-8' },
      jsonBody: {
        statuses: latestPosition ? [{ latestPosition }] : [],
        nextToken: null,
      },
    },
  })

export const openPersonLocations = async (page: Page, crn: string): Promise<void> => {
  const redirectTo = encodeURIComponent(`/people/${crn}/locations`)
  await page.goto(`/people/${crn}?redirectTo=${redirectTo}`)
  await expect(page).toHaveURL(new RegExp(`/people/${crn}/locations$`))
}

export const goToCasesPage = async (page: Page): Promise<void> => {
  await page.goto('/cases/1/overview')
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
