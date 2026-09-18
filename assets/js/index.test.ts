/**
 * @jest-environment jsdom
 */

const mockGovukInitAll = jest.fn()
const mockMojInitAll = jest.fn()

jest.mock('govuk-frontend', () => ({ initAll: mockGovukInitAll }))
jest.mock('@ministryofjustice/frontend', () => ({ initAll: mockMojInitAll }))
jest.mock('@ministryofjustice/hmpps-electronic-monitoring-components/map', () => ({}))
jest.mock('./views/cases/index', () => jest.fn())
jest.mock('./utils/appInsights', () => ({}))
jest.mock('./utils/technicalUpdatesBanner', () => ({ initialiseTechnicalUpdatesBanner: jest.fn() }))

describe('frontend initialisation', () => {
  it('scopes MOJ components to the main content', () => {
    document.body.innerHTML = `
      <header data-module="pds-header"></header>
      <main></main>
    `

    jest.isolateModules(() => {
      jest.requireActual('./index')
    })

    const main = document.querySelector('main')

    expect(mockGovukInitAll).toHaveBeenCalledTimes(1)
    expect(mockMojInitAll).toHaveBeenCalledWith({ scope: main })
  })
})
