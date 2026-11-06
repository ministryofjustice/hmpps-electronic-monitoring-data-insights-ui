/**
 * @jest-environment jsdom
 */

import '@testing-library/jest-dom'
import initialiseMapFullscreen from './mapFullscreen'

describe('map fullscreen layout', () => {
  let button: HTMLButtonElement
  let container: HTMLElement
  let workspace: HTMLElement
  let sidebar: HTMLElement
  let updateSize: jest.Mock
  let cleanup: () => void
  const disconnect = jest.fn()

  beforeEach(() => {
    window.sessionStorage.clear()
    jest.spyOn(window, 'scrollTo').mockImplementation(() => {})
    global.ResizeObserver = jest.fn().mockImplementation(() => ({
      observe: jest.fn(),
      disconnect,
    }))
    document.body.innerHTML = `
      <header>Existing service header</header>
      <nav data-qa="primary-navigation">Existing navigation</nav>
      <main>
      <a id="background-link" href="/other">Other page content</a>
      <div data-qa="location-data-error">No locations found</div>
      <div data-qa="cases-header">CRN and date of birth</div>
      <h1 data-map-person-name>Billy Hoskins</h1>
      <div data-map-workspace>
        <div data-map-sidebar>
          <div data-map-search>
            <form action="/locations" method="get">
              <div class="map-search__periods">
                <div id="start-component">
                  <input id="start-date" value="12/2/2026">
                  <div class="map-search__time"><input id="start-hour" value="12"></div>
                </div>
                <div id="end-component">
                  <input id="end-date" value="12/2/2026">
                  <div class="map-search__time"><input id="end-hour" value="23"></div>
                </div>
              </div>
              <button type="submit">Update map</button>
            </form>
          </div>
        </div>
        <div class="map-workspace__main"><div data-qa="em-map"></div></div>
      </div>
      </main>
      <footer><a href="/footer">Footer link</a></footer>
    `
    workspace = document.querySelector<HTMLElement>('[data-map-workspace]')!
    sidebar = document.querySelector<HTMLElement>('[data-map-sidebar]')!
    container = document.querySelector<HTMLElement>('[data-qa="em-map"]')!
    const host = document.createElement('div')
    const shadowRoot = host.attachShadow({ mode: 'open' })
    button = document.createElement('button')
    button.type = 'button'
    shadowRoot.appendChild(button)
    container.appendChild(host)
    updateSize = jest.fn()
    window.sessionStorage.setItem(`emdi-map-fullscreen:${window.location.pathname}`, 'false')
    cleanup = initialiseMapFullscreen(button, container, updateSize)
  })

  afterEach(() => {
    cleanup()
    Reflect.deleteProperty(document.documentElement, 'requestFullscreen')
    Reflect.deleteProperty(document, 'fullscreenElement')
    Reflect.deleteProperty(document, 'exitFullscreen')
    jest.restoreAllMocks()
    jest.clearAllMocks()
    document.body.innerHTML = ''
  })

  it('expands below the existing navigation and reuses the map, person details and form', () => {
    const navigation = document.querySelector<HTMLElement>('nav')!
    jest.spyOn(navigation, 'getBoundingClientRect').mockReturnValue(new DOMRect(0, 60, 900, 45))
    const details = document.querySelector('[data-qa="cases-header"]')
    const form = sidebar.querySelector('form')!
    const mapHost = container.firstElementChild
    const change = jest.fn()
    form.addEventListener('change', change)

    button.click()

    expect(workspace).toHaveClass('map-workspace--expanded')
    expect(document.documentElement).toHaveClass('emdi-map-expanded')
    expect(workspace.style.getPropertyValue('--map-workspace-top')).toBe('105px')
    expect(sidebar.querySelector('[data-qa="cases-header"]')).toBe(details)
    expect(sidebar.firstElementChild).toHaveTextContent('Billy Hoskins')
    expect(sidebar.querySelector('form')).toBe(form)
    expect(sidebar.querySelector('[data-qa="location-data-error"]')).toHaveTextContent('No locations found')
    expect(container.firstElementChild).toBe(mapHost)
    expect(form).toHaveAttribute('method', 'get')
    expect(button).toHaveAccessibleName('Exit full screen map')
    expect(button).toHaveAttribute('aria-expanded', 'true')
    expect(updateSize).toHaveBeenCalledTimes(1)
    form.dispatchEvent(new Event('change'))
    expect(change).toHaveBeenCalledTimes(1)
    expect(document.querySelector('header')).toHaveTextContent('Existing service header')
  })

  it('orders dates before times in both DOM and keyboard order, then restores the original fields', () => {
    const startTime = document.querySelector('#start-hour')!
    button.click()

    expect(Array.from(sidebar.querySelectorAll('input')).map(input => input.id)).toEqual([
      'start-date',
      'end-date',
      'start-hour',
      'end-hour',
    ])
    expect(document.querySelector('#start-hour')).toBe(startTime)
    expect(startTime).toHaveValue('12')

    button.click()

    expect(document.querySelector('#start-component #start-hour')).toBe(startTime)
    expect(Array.from(sidebar.querySelectorAll('input')).map(input => input.id)).toEqual([
      'start-date',
      'start-hour',
      'end-date',
      'end-hour',
    ])
  })

  it('restores details, scroll and button focus on Escape from the shadow DOM', () => {
    const details = document.querySelector('[data-qa="cases-header"]')!
    const originalParent = details.parentNode
    const originalNext = details.nextSibling
    jest.replaceProperty(window, 'scrollY', 240)
    button.click()

    button.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, composed: true }))

    expect(workspace).not.toHaveClass('map-workspace--expanded')
    expect(document.documentElement).not.toHaveClass('emdi-map-expanded')
    expect(details.parentNode).toBe(originalParent)
    expect(details.nextSibling).toBe(originalNext)
    expect(button).toHaveAccessibleName('Full screen map')
    expect(button).toHaveAttribute('aria-expanded', 'false')
    expect(button.getRootNode()).toHaveProperty('activeElement', button)
    expect(window.scrollTo).toHaveBeenLastCalledWith(0, 240)
    expect(updateSize).toHaveBeenCalledTimes(2)
  })

  it('lets a child widget consume Escape without collapsing the map', () => {
    button.click()
    const event = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true })
    event.preventDefault()

    document.dispatchEvent(event)

    expect(workspace).toHaveClass('map-workspace--expanded')
  })

  it('requests browser fullscreen with hidden browser UI and restores layout on browser exit', () => {
    const requestFullscreen = jest.fn().mockResolvedValue(undefined)
    const exitFullscreen = jest.fn().mockResolvedValue(undefined)
    Object.defineProperty(document.documentElement, 'requestFullscreen', {
      configurable: true,
      value: requestFullscreen,
    })
    Object.defineProperty(document, 'exitFullscreen', { configurable: true, value: exitFullscreen })
    Object.defineProperty(document, 'fullscreenElement', {
      configurable: true,
      value: document.documentElement,
    })

    button.click()

    expect(requestFullscreen).toHaveBeenCalledWith({ navigationUI: 'hide' })
    expect(workspace).toHaveClass('map-workspace--expanded')
    expect(button).toHaveAccessibleName('Exit full screen map')

    button.click()

    expect(exitFullscreen).toHaveBeenCalled()
    expect(workspace).not.toHaveClass('map-workspace--expanded')

    Object.defineProperty(document, 'fullscreenElement', { configurable: true, value: null })
    button.click()
    Object.defineProperty(document, 'fullscreenElement', {
      configurable: true,
      value: document.documentElement,
    })
    document.dispatchEvent(new Event('fullscreenchange'))
    expect(workspace).toHaveClass('map-workspace--expanded')

    Object.defineProperty(document, 'fullscreenElement', { configurable: true, value: null })
    document.dispatchEvent(new Event('fullscreenchange'))
    expect(workspace).not.toHaveClass('map-workspace--expanded')
  })

  it('recalculates the available map area when the window resizes', () => {
    button.click()
    updateSize.mockClear()

    window.dispatchEvent(new Event('resize'))

    expect(updateSize).toHaveBeenCalledTimes(1)
  })

  it('prevents focus entering covered page content while keeping the service header accessible', () => {
    button.click()

    expect(document.querySelector('#background-link')).toHaveAttribute('inert')
    expect(document.querySelector('footer')).toHaveAttribute('inert')
    expect(document.querySelector('header')).not.toHaveAttribute('inert')
    expect(document.querySelector('nav')).not.toHaveAttribute('inert')

    button.click()

    expect(document.querySelector('#background-link')).not.toHaveAttribute('inert')
    expect(document.querySelector('footer')).not.toHaveAttribute('inert')
  })

  it('removes its event handlers and restores the normal layout when removed', () => {
    button.click()
    cleanup()
    updateSize.mockClear()

    button.click()
    window.dispatchEvent(new Event('resize'))

    expect(workspace).not.toHaveClass('map-workspace--expanded')
    expect(document.documentElement).not.toHaveClass('emdi-map-expanded')
    expect(updateSize).not.toHaveBeenCalled()
    expect(disconnect).toHaveBeenCalled()
  })
})
