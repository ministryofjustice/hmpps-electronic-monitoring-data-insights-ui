import express from 'express'
import nunjucksSetup from '../../utils/nunjucksSetup'

const renderPrimaryHeader = async (activeNav?: string): Promise<string> => {
  const app = express()
  nunjucksSetup(app)

  return new Promise((resolve, reject) => {
    app.render('partials/primaryHeader', { activeNav }, (error, html) => {
      if (error) {
        reject(error)
        return
      }

      resolve(html)
    })
  })
}

describe('primaryHeader template', () => {
  it('renders the service phase banner with feedback and support links', async () => {
    const html = await renderPrimaryHeader()

    expect(html).toContain('data-qa="service-phase-banner"')
    expect(html).toMatch(/<strong class="govuk-tag govuk-phase-banner__content__tag">\s*Beta\s*<\/strong>/)
    expect(html).toContain('This is a new service.')
    expect(html).toContain('href="https://www.smartsurvey.co.uk/t/CF3MFT/"')
    expect(html).toContain('target="_blank"')
    expect(html).toContain('Give feedback (opens in a new tab)')
    expect(html).toContain('href="mailto:emdisupport@justice.gov.uk?subject=EMDI problem"')
    expect(html).toContain('report a problem')
  })

  it('renders the primary navigation alongside the phase banner', async () => {
    const html = await renderPrimaryHeader('cases')

    expect(html).toContain('data-qa="primary-navigation"')
    expect(html).toContain('aria-label="Primary navigation"')
    expect(html).toContain('href="https://manage-people-on-probation-dev.hmpps.service.justice.gov.uk/case"')
    expect(html).toContain('aria-current="page"')
    expect(html).toContain('Cases')
  })
})
