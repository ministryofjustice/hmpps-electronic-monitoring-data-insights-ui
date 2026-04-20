/**
 * @jest-environment jsdom
 */

import { EmMap } from '@ministryofjustice/hmpps-electronic-monitoring-components/map'
import { ComposableLayer } from '@ministryofjustice/hmpps-electronic-monitoring-components/map/layers'
import MapLayersControl from './mapLayersControls'

jest.mock('ol/control/Control', () => {
  return class Control {
    constructor() {}
  }
})

jest.mock('@ministryofjustice/hmpps-electronic-monitoring-components/map', () => ({}))
jest.mock('@ministryofjustice/hmpps-electronic-monitoring-components/map/layers', () => ({}))

const makeLayer = (id: string): ComposableLayer => ({ id }) as unknown as ComposableLayer

const makeMockMap = (visible = true): EmMap =>
  ({
    getNativeLayer: jest.fn(() => ({ getVisible: jest.fn(() => visible) })),
  }) as unknown as EmMap

const makeOpts = (map: EmMap) => ({
  tracksLayer: makeLayer('tracks'),
  confidenceLayer: makeLayer('confidence'),
  numbersLayer: makeLayer('numbers'),
  mapContainer: document.createElement('div'),
  map,
})

describe('MapLayersControl', () => {
  let mapContainer: HTMLElement

  beforeEach(() => {
    const opts = makeOpts(makeMockMap())
    mapContainer = opts.mapContainer
    // eslint-disable-next-line no-new
    new MapLayersControl(opts)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('initial state', () => {
    it('renders the panel visible', () => {
      const panel = mapContainer.querySelector('.mlc-panel') as HTMLElement
      expect(panel).toBeTruthy()
      expect(panel.style.display).not.toBe('none')
    })

    it('renders the open button hidden', () => {
      const openBtn = mapContainer.querySelector('.mlc-open-btn') as HTMLElement
      expect(openBtn).toBeTruthy()
      expect(openBtn.hasAttribute('data-hidden')).toBe(true)
    })
  })

  describe('when the close button is clicked', () => {
    beforeEach(() => {
      const closeBtn = mapContainer.querySelector('.mlc-panel__close') as HTMLElement
      closeBtn.click()
    })

    it('hides the panel', () => {
      const panel = mapContainer.querySelector('.mlc-panel') as HTMLElement
      expect(panel.getAttribute('data-hidden')).toBeTruthy()
    })

    it('shows the open button', () => {
      const openBtn = mapContainer.querySelector('.mlc-open-btn') as HTMLElement
      expect(openBtn.hasAttribute('data-hidden')).toBe(false)
    })
  })

  describe('when the open button is clicked after closing', () => {
    beforeEach(() => {
      const closeBtn = mapContainer.querySelector('.mlc-panel__close') as HTMLElement
      closeBtn.click()
      const openBtn = mapContainer.querySelector('.mlc-open-btn') as HTMLElement
      openBtn.click()
    })

    it('shows the panel again', () => {
      const panel = mapContainer.querySelector('.mlc-panel') as HTMLElement
      expect(panel.hasAttribute('data-hidden')).toBe(false)
    })

    it('hides the open button again', () => {
      const openBtn = mapContainer.querySelector('.mlc-open-btn') as HTMLElement
      expect(openBtn.hasAttribute('data-hidden')).toBe(true)
    })
  })
})
