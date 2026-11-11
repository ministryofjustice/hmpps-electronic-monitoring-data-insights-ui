/**
 * @jest-environment jsdom
 */

import '@testing-library/jest-dom'
import Map from 'ol/Map'
import Zoom from 'ol/control/Zoom'
import MapFullscreenControl from './mapFullscreenControl'

describe('MapFullscreenControl', () => {
  beforeEach(() => {
    window.sessionStorage.clear()
    global.ResizeObserver = jest.fn().mockImplementation(() => ({
      observe: jest.fn(),
      unobserve: jest.fn(),
      disconnect: jest.fn(),
    }))
  })

  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('mounts the supplied button before zoom in and zoom out in the map shadow DOM tab order', () => {
    document.body.innerHTML = `
      <div data-map-workspace>
        <div data-map-sidebar></div>
        <div data-qa="em-map"></div>
      </div>
    `
    const mapContainer = document.querySelector<HTMLElement>('[data-qa="em-map"]')!
    const host = document.createElement('div')
    const shadowRoot = host.attachShadow({ mode: 'open' })
    const viewport = document.createElement('div')
    shadowRoot.appendChild(viewport)
    mapContainer.appendChild(host)
    const map = new Map({ target: viewport, controls: [new Zoom()], interactions: [] })
    const control = new MapFullscreenControl(mapContainer)
    map.addControl(control)

    const button = shadowRoot.querySelector<HTMLButtonElement>('#emdi-map-fullscreen-toggle')
    expect(button).toHaveClass('emdi-map-fullscreen-toggle')
    expect(button).toHaveAttribute('type', 'button')
    expect(button).toHaveAccessibleName('Full screen map')
    expect(button).toHaveAttribute('title', 'Full screen map')
    const icon = button?.querySelector('svg')
    expect(icon).toHaveAttribute('aria-hidden', 'true')
    expect(icon).toHaveAttribute('focusable', 'false')
    expect(icon).toHaveAttribute('viewBox', '0 0 44 44')
    expect(icon?.querySelector('path')).toHaveAttribute('d', 'M10 16V10h6M28 10h6v6M34 28v6h-6M16 34h-6v-6')
    expect(document.querySelector('#emdi-map-fullscreen-toggle')).toBeNull()
    const buttons = Array.from(shadowRoot.querySelectorAll<HTMLButtonElement>('button'))
    expect(buttons.map(element => element.className)).toEqual([
      'emdi-map-fullscreen-toggle',
      'ol-zoom-in',
      'ol-zoom-out',
    ])
    buttons.forEach(element => expect(element.tabIndex).toBe(0))

    map.removeControl(control)
    map.addControl(control)

    expect(shadowRoot.querySelector('button')).toBe(button)

    map.removeControl(control)

    expect(shadowRoot.querySelector('#emdi-map-fullscreen-toggle')).toBeNull()
    map.dispose()
  })
})
