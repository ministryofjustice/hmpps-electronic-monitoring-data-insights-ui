import express from 'express'
import nunjucksSetup from '../../utils/nunjucksSetup'
import casesLocationLocale from '../../controllers/cases/cases-location.locale.json'

const renderMapSearchForm = async (showCrn?: boolean): Promise<string> => {
  const app = express()
  nunjucksSetup(app)

  return new Promise((resolve, reject) => {
    app.render(
      'partials/mapSearchForm',
      {
        locale: casesLocationLocale,
        mapControls: {
          baseLayer: 'street',
          tracks: true,
          confidence: true,
          numbers: true,
        },
        dateFilterForm: {
          action: '/people/X31092/locations',
          crn: 'X31092',
          showCrn,
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

describe('mapSearchForm template', () => {
  it('renders the CRN input by default for cases', async () => {
    const html = await renderMapSearchForm()

    expect(html).toContain('name="crn"')
    expect(html).toContain('value="X31092"')
  })

  it('omits the CRN input when showCrn is false for people', async () => {
    const html = await renderMapSearchForm(false)

    expect(html).not.toContain('name="crn"')
    expect(html).not.toContain('value="X31092"')
  })
})
