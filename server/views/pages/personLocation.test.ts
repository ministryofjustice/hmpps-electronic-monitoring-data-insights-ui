import express from 'express'
import nunjucksSetup from '../../utils/nunjucksSetup'
import casesLocationLocale from '../../controllers/cases/cases-location.locale.json'

const renderPersonLocation = async (hasErrors: boolean = false): Promise<string> => {
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
    const html = await renderPersonLocation(true)

    expect(html).toContain('<title>Error: HMPPS Electronic Monitoring Data Insights Ui - Person Location</title>')
  })
})
