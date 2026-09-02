import express from 'express'
import nunjucksSetup from '../../utils/nunjucksSetup'

interface RenderOptions {
  activeNav?: string
  showTechnicalUpdatesBanner?: boolean
  whatsNewVersion?: string
  currentUrl?: string
}

const renderPrimaryHeader = async (options: RenderOptions = {}): Promise<string> => {
  const app = express()
  nunjucksSetup(app)

  return new Promise((resolve, reject) => {
    app.render('partials/primaryHeader', options, (error, html) => {
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
    expect(html).toContain('href="https://www.smartsurvey.co.uk/t/AAGPPN?service=EM%20Data%20Insights"')
    expect(html).toContain('target="_blank"')
    expect(html).toContain('Give feedback (opens in a new tab)')
    expect(html).toContain('href="mailto:emdisupport@justice.gov.uk?subject=EMDI problem"')
    expect(html).toContain('report a problem')
  })

  it('renders the primary navigation alongside the phase banner', async () => {
    const html = await renderPrimaryHeader({ activeNav: 'cases' })

    expect(html).toContain('data-qa="primary-navigation"')
    expect(html).toContain('aria-label="Primary navigation"')
    expect(html).toContain('href="https://manage-people-on-probation-dev.hmpps.service.justice.gov.uk/case"')
    expect(html).toContain('aria-current="page"')
    expect(html).toContain('Cases')
  })

  it('renders all primary navigation items with the correct hrefs', async () => {
    const html = await renderPrimaryHeader()

    expect(html).toContain('href="https://manage-people-on-probation-dev.hmpps.service.justice.gov.uk"')
    expect(html).toContain('href="https://manage-people-on-probation-dev.hmpps.service.justice.gov.uk/case"')
    expect(html).toContain('href="https://manage-people-on-probation-dev.hmpps.service.justice.gov.uk/search"')
    expect(html).toContain('href="https://manage-people-on-probation-dev.hmpps.service.justice.gov.uk/alerts"')
    expect(html).toContain('Home')
    expect(html).toContain('Search')
    expect(html).toContain('Alerts')
  })

  it('does not mark any nav item as active when activeNav does not match', async () => {
    const html = await renderPrimaryHeader({ activeNav: 'something-else' })

    expect(html).not.toContain('aria-current="page"')
  })

  describe('technical updates banner', () => {
    it('does not render the technical updates banner when showTechnicalUpdatesBanner is not set', async () => {
      const html = await renderPrimaryHeader()

      expect(html).not.toContain('New features')
      expect(html).not.toContain('Hide message')
    })

    it('does not render the technical updates banner when showTechnicalUpdatesBanner is false', async () => {
      const html = await renderPrimaryHeader({ showTechnicalUpdatesBanner: false })

      expect(html).not.toContain('New features')
      expect(html).not.toContain('Hide message')
    })

    it('renders the technical updates banner with the correct content when showTechnicalUpdatesBanner is true', async () => {
      const html = await renderPrimaryHeader({
        showTechnicalUpdatesBanner: true,
        whatsNewVersion: '1.2.3',
        currentUrl: '/cases/123',
      })

      expect(html).toContain('New features')
      expect(html).toContain('We’re updating the service all the time,')
      expect(html).toContain('href="/whats-new?returnUrl=/cases/123"')
      expect(html).toContain('find out more on the What’s new page.')
      expect(html).toContain('Hide message')
    })

    it('passes the whatsNewVersion through to the banner', async () => {
      const html = await renderPrimaryHeader({
        showTechnicalUpdatesBanner: true,
        whatsNewVersion: '9.9.9',
        currentUrl: '/',
      })

      expect(html).toContain('9.9.9')
    })
  })
})
