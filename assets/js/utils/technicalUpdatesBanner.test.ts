/**
 * @jest-environment jsdom
 */

import { initialiseTechnicalUpdatesBanner } from './technicalUpdatesBanner'

describe('initialiseTechnicalUpdatesBanner', () => {
  const STORAGE_KEY = 'technicalUpdatesBannerDismissedVersion'

  const renderBanner = (version = '0.0.1') => {
    document.body.innerHTML = `
      <div id="technical-updates-banner" data-banner-version="${version}" style="display: block;">
        <a id="hide-message" href="#">Hide message</a>
      </div>
    `
  }

  beforeEach(() => {
    document.body.innerHTML = ''
    localStorage.clear()
  })

  it('does nothing when the banner is not present on the page', () => {
    document.body.innerHTML = ''
    expect(() => initialiseTechnicalUpdatesBanner()).not.toThrow()
  })

  it('shows the banner on its first ever view', () => {
    renderBanner('0.0.1')

    initialiseTechnicalUpdatesBanner()

    const banner = document.getElementById('technical-updates-banner') as HTMLElement
    expect(banner.style.display).not.toBe('none')
  })

  it('records the current version as seen after the first view, so it will auto-hide next time', () => {
    renderBanner('0.0.1')

    initialiseTechnicalUpdatesBanner()

    expect(localStorage.getItem(STORAGE_KEY)).toBe('0.0.1')
  })

  it('auto-hides the banner on a subsequent load once the version has already been seen', () => {
    localStorage.setItem(STORAGE_KEY, '0.0.1')
    renderBanner('0.0.1')

    initialiseTechnicalUpdatesBanner()

    const banner = document.getElementById('technical-updates-banner') as HTMLElement
    expect(banner.style.display).toBe('none')
  })

  it('shows the banner again when a new version is published, even if a previous version was seen', () => {
    localStorage.setItem(STORAGE_KEY, '0.0.2')
    renderBanner('0.0.1')

    initialiseTechnicalUpdatesBanner()

    const banner = document.getElementById('technical-updates-banner') as HTMLElement
    expect(banner.style.display).not.toBe('none')
    expect(localStorage.getItem(STORAGE_KEY)).toBe('0.0.1')
  })

  it('hides the banner immediately and records the version when the hide link is clicked', () => {
    renderBanner('0.0.1')
    initialiseTechnicalUpdatesBanner()

    const hideLink = document.getElementById('hide-message') as HTMLElement
    hideLink.click()

    const banner = document.getElementById('technical-updates-banner') as HTMLElement
    expect(banner.style.display).toBe('none')
    expect(localStorage.getItem(STORAGE_KEY)).toBe('0.0.1')
  })

  it('prevents the default link navigation when the hide link is clicked', () => {
    renderBanner('0.0.1')
    initialiseTechnicalUpdatesBanner()

    const hideLink = document.getElementById('hide-message') as HTMLElement
    const clickEvent = new MouseEvent('click', { bubbles: true, cancelable: true })
    const preventDefaultSpy = jest.spyOn(clickEvent, 'preventDefault')

    hideLink.dispatchEvent(clickEvent)

    expect(preventDefaultSpy).toHaveBeenCalled()
  })

  it('does nothing when the hide link is not present', () => {
    document.body.innerHTML = `
      <div id="technical-updates-banner" data-banner-version="0.0.1"></div>
    `

    expect(() => initialiseTechnicalUpdatesBanner()).not.toThrow()
  })
})
