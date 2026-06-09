import express from 'express'
import nunjucksSetup from '../../utils/nunjucksSetup'
import casesLocationLocale from '../../controllers/cases/cases-location.locale.json'

const renderPersonLocation = async (): Promise<string> => {
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
          tier: 'B3',
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
        },
        dateFilterForm: {
          action: '/people/X31092/locations',
          showCrn: false,
          errors: [],
          errorSummary: [],
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

    expect(html).toContain('Location activity')
    expect(html).toContain('data-qa="em-map"')
    expect(html).toContain('action="/people/X31092/locations"')
    expect(html).not.toContain('name="crn"')
  })
})
