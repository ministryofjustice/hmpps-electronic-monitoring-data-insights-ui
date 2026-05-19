import express from 'express'
import nunjucksSetup from '../../utils/nunjucksSetup'

const renderMapHelp = async (locale: unknown): Promise<string> => {
  const app = express()
  nunjucksSetup(app)
  app.locals.feComponents = {
    jsIncludes: [],
    cssIncludes: [],
    header: '',
    footer: '',
  }

  return new Promise((resolve, reject) => {
    app.render('pages/mapHelp', { locale }, (error, html) => {
      if (error) {
        reject(error)
        return
      }

      resolve(html)
    })
  })
}

describe('mapHelp template', () => {
  it('renders sections with all supported content types', async () => {
    const html = await renderMapHelp({
      title: 'Help with the map',
      content: {
        confidenceCircles: {
          title: 'Location accuracy',
          image: {
            src: '/assets/images/confidence-circles.png',
            alt: 'Location accuracy map',
          },
          'first-pagaraphs': ['First paragraph', 'Second paragraph'],
          insert: 'Inset paragraph',
          bulletPoints: ['Shared bullet'],
          firstBulletPoints: ['First bullet'],
          'last-pagaraphs': ['Last paragraph'],
          lastBulletPoints: ['Last bullet'],
        },
      },
    })

    expect(html).toContain('Help with the map')
    expect(html).toContain('Location accuracy')
    expect(html).toContain('src="/assets/images/confidence-circles.png"')
    expect(html).toContain('alt="Location accuracy map"')
    expect(html).toContain('First paragraph')
    expect(html).toContain('Second paragraph')
    expect(html).toContain('<p class="govuk-inset-text">Inset paragraph</p>')
    expect(html).toContain('Shared bullet')
    expect(html).toContain('First bullet')
    expect(html).toContain('Last paragraph')
    expect(html).toContain('Last bullet')
  })

  it('renders safely when optional content is missing', async () => {
    const html = await renderMapHelp({
      title: 'Help with the map',
      content: {
        gps: {
          title: 'GPS delay',
          'first-pagaraphs': ['Only paragraph'],
        },
        linesAndArrows: {
          image: {
            alt: 'Image without src should not render',
          },
        },
      },
    })

    expect(html).toContain('GPS delay')
    expect(html).toContain('Only paragraph')
    expect(html).not.toContain('Image without src should not render')
    expect(html).not.toContain('<img')
  })

  it('skips empty sections and empty items without failing', async () => {
    const html = await renderMapHelp({
      title: 'Help with the map',
      content: {
        emptySection: null,
        partialSection: {
          title: 'Partial section',
          'first-pagaraphs': ['', null, 'Renderable paragraph'],
          insert: '',
          bulletPoints: ['', null, 'Renderable bullet'],
          lastBulletPoints: [null, 'Final bullet'],
        },
      },
    })

    expect(html).toContain('Partial section')
    expect(html).toContain('Renderable paragraph')
    expect(html).toContain('Renderable bullet')
    expect(html).toContain('Final bullet')
    expect(html).not.toContain('<li></li>')
    expect(html).not.toContain('govuk-inset-text')
  })
})
