import express from 'express'
import nunjucksSetup from '../../utils/nunjucksSetup'
import casesLocationLocale from '../../controllers/cases/cases-location.locale.json'

interface RenderOverrides {
  hasErrors?: boolean
  isDataFreshnessError?: boolean
  dataFreshness?: { statuses: Array<{ code: string; description: string; latestPosition: string }> }
  locationAlert?: { text: string } | null
}

const renderPersonLocation = async (overrides: RenderOverrides = {}): Promise<string> => {
  const {
    hasErrors = false,
    isDataFreshnessError = false,
    dataFreshness = { statuses: [] },
    locationAlert = null,
  } = overrides
  const app = express()
  nunjucksSetup(app)
  app.locals.feComponents = {
    jsIncludes: [],
    cssIncludes: [],
    header: '',
    footer: '',
  }

  return new Promise((resolve, reject) => {
    app.render(
      'pages/personLocation',
      {
        locale: casesLocationLocale,
        cspNonce: 'test-nonce',
        currentUrl: encodeURIComponent('/people/X31092/locations'),
        fullName: 'DEVWR0004718',
        popData: {
          crn: 'X31092',
          dateOfBirth: '2020-01-01',
        },
        showComplianceBadge: false,
        personContext: {
          personId: '41591',
          consumerId: '9b74b1071beb2210743d8551f54bcbcc',
          fullName: 'DEVWR0004718',
          dateOfBirth: '2020-01-01',
        },
        positions: [],
        mapControls: {
          baseLayer: 'street',
          tracks: true,
          confidence: true,
          numbers: true,
          heatmap: false,
        },
        dateFilterForm: {
          action: '/people/X31092/locations',
          showCrn: false,
          errors: hasErrors ? [{ field: 'start.hour', message: 'From hour must be between 00 and 23' }] : [],
          errorSummary: hasErrors ? [{ text: 'From hour must be between 00 and 23', href: '#start-hour' }] : [],
          values: {
            fromDate: { date: '', hour: '', minute: '' },
            toDate: { date: '', hour: '', minute: '' },
          },
        },
        isDataFreshnessError,
        dataFreshness,
        locationAlert,
      },
      (error, html) => {
        if (error) {
          reject(error)
          return
        }

        resolve(html)
      },
    )
  })
}

describe('personLocation template', () => {
  it('renders the map search page without a CRN input', async () => {
    const html = await renderPersonLocation()

    expect(html).toContain('GPS data')
    expect(html).toContain('Electronic monitoring - GPS data')
    expect(html).toContain('data-qa="em-map"')
    expect(html).toContain('action="/people/X31092/locations"')
    expect(html).not.toContain('name="crn"')
  })

  it('renders person details as a labelled region rather than a second header', async () => {
    const html = await renderPersonLocation()

    expect(html).toContain('<div class="profile-info-header" role="region" aria-label="Person details">')
    expect(html).not.toContain('<header class="profile-info-header"')
  })

  it('front-loads the page title when the form has errors', async () => {
    const html = await renderPersonLocation({ hasErrors: true })

    expect(html).toContain('<title>Error: HMPPS Electronic Monitoring Data Insights Ui - Person Location</title>')
  })

  describe('data freshness banner', () => {
    it('shows the sync-service-down banner when isDataFreshnessError is true', async () => {
      const html = await renderPersonLocation({ isDataFreshnessError: true })

      expect(html).toContain('The data sync service is currently down')
    })

    it('shows the stale-data banner with formatted date and time when data is out of sync', async () => {
      const html = await renderPersonLocation({
        isDataFreshnessError: false,
        dataFreshness: {
          statuses: [
            { code: 'DATA_OUT_OF_SYNC', description: 'Data out of sync', latestPosition: '2026-08-28T14:54:25Z' },
          ],
        },
      })

      expect(html).toContain('28 August 2026')
      expect(html).toContain('There is currently a problem connecting to the trail data')
      expect(html).toContain('The tag is still recording')
    })

    it('prioritises the sync-service-down banner over the stale-data banner when both apply', async () => {
      const html = await renderPersonLocation({
        isDataFreshnessError: true,
        dataFreshness: {
          statuses: [
            { code: 'DATA_OUT_OF_SYNC', description: 'Data out of sync', latestPosition: '2026-08-28T14:54:25Z' },
          ],
        },
      })

      expect(html).toContain('The data sync service is currently down')
      expect(html).not.toContain('problem connecting to the trail data')
    })

    it('renders the dataRecency partial when there is no freshness error and no out-of-sync status', async () => {
      const html = await renderPersonLocation({
        isDataFreshnessError: false,
        dataFreshness: { statuses: [] },
      })
      expect(html).toContain('Service data is updated every 15 minutes.')
      expect(html).not.toContain('The data sync service is currently down')
      expect(html).not.toContain('problem connecting to the trail data')
    })
  })

  describe('location alert', () => {
    it('does not render the alert when locationAlert is null', async () => {
      const html = await renderPersonLocation({ locationAlert: null })

      expect(html).not.toContain('data-qa="location-data-error"')
    })

    it('renders the alert text when locationAlert has text', async () => {
      const html = await renderPersonLocation({ locationAlert: { text: 'No results found for this search' } })

      expect(html).toContain('data-qa="location-data-error"')
      expect(html).toContain('No results found for this search')
    })
  })
})
