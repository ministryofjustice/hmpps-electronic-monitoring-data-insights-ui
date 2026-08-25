import express from 'express'
import nunjucksSetup from '../../utils/nunjucksSetup'
import casesLocationLocale from '../../controllers/cases/cases-location.locale.json'

interface ValidationError {
  field: string
  message: string
}

const renderMapSearchForm = async (showCrn?: boolean, errors: ValidationError[] = []): Promise<string> => {
  const app = express()
  nunjucksSetup(app)

  return new Promise((resolve, reject) => {
    app.render(
      'partials/mapSearchForm',
      {
        locale: casesLocationLocale,
        enableHeatmap: true,
        enableExclusionZones: true,
        mapControls: {
          baseLayer: 'street',
          tracks: true,
          confidence: true,
          numbers: true,
          heatmap: false,
        },
        dateFilterForm: {
          action: '/people/X31092/locations',
          crn: 'X31092',
          showCrn,
          errors,
          errorSummary: errors.map(error => ({ text: error.message, href: `#${error.field.replace('.', '-')}` })),
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
  it('renders the heatmap map control hidden input so search requests preserve state', async () => {
    const html = await renderMapSearchForm()

    expect(html).toContain('name="mapControls[heatmap]"')
    expect(html).toContain('value="false"')
  })

  it('renders the exclusion zones map control hidden input so search requests preserve state', async () => {
    const html = await renderMapSearchForm()

    expect(html).toContain('name="mapControls[exclusion]"')
    expect(html).toContain('value="false"')
  })

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

  it('only renders fieldsets that have legends', async () => {
    const html = await renderMapSearchForm()
    const fieldsets = html.match(/<fieldset\b[\s\S]*?<\/fieldset>/g) ?? []

    expect(fieldsets).toHaveLength(2)
    fieldsets.forEach(fieldset => expect(fieldset).toContain('<legend'))
  })

  it('gives each time input a distinct accessible name', async () => {
    const html = await renderMapSearchForm()

    expect(html).toContain('aria-label="Time from hour"')
    expect(html).toContain('aria-label="Time from minute"')
    expect(html).toContain('aria-label="Time to hour"')
    expect(html).toContain('aria-label="Time to minute"')
  })

  it('only highlights the time input when the hour has an error', async () => {
    const html = await renderMapSearchForm(undefined, [
      { field: 'start.hour', message: 'From hour must be between 00 and 23' },
    ])
    const dateInput = html.match(/<input\b[^>]*id="start-date"[^>]*>/)?.[0]
    const hourInput = html.match(/<input\b[^>]*id="start-hour"[^>]*>/)?.[0]

    expect(dateInput).toBeDefined()
    expect(dateInput).not.toContain('govuk-input--error')
    expect(hourInput).toContain('govuk-input--error')
  })
})
