/**
 * @jest-environment jsdom
 */

import { EmMap } from '@ministryofjustice/hmpps-electronic-monitoring-components/map'
import { ComposableLayer } from '@ministryofjustice/hmpps-electronic-monitoring-components/map/layers'
import type BaseLayer from 'ol/layer/Base'
import MapLayersControl from './mapLayersControls'

/* eslint-disable no-new */
jest.mock('ol/control/Control', () => {
  return class Control {
    constructor() {}
  }
})

jest.mock('@ministryofjustice/hmpps-electronic-monitoring-components/map', () => ({}))
jest.mock('@ministryofjustice/hmpps-electronic-monitoring-components/map/layers', () => ({}))

const makeBaseLayer = (visible = false) => ({
  getVisible: jest.fn(() => visible),
  setVisible: jest.fn(),
})

const makeLayer = (id: string, nativeLayer: unknown = makeNativeLayer()): ComposableLayer =>
  ({
    id,
    getNativeLayer: jest.fn(() => nativeLayer),
    getPrimaryLayer: jest.fn(() => nativeLayer),
    attach: jest.fn(),
    detach: jest.fn(),
  }) as unknown as ComposableLayer

const makeNativeLayer = (visible = true) => ({
  getVisible: jest.fn(() => visible),
  setVisible: jest.fn(),
})

const makeMockMap = (visible = true): EmMap => {
  const layers = {
    tracks: makeNativeLayer(visible),
    confidence: makeNativeLayer(visible),
    numbers: makeNativeLayer(visible),
    exclusion: makeNativeLayer(visible),
  }

  return {
    getNativeLayer: jest.fn((id: keyof typeof layers) => layers[id]),
  } as unknown as EmMap
}

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

    it('renders controls from the provided initial state', () => {
      const opts = makeOpts(makeMockMap())
      mapContainer = opts.mapContainer

      new MapLayersControl({
        ...opts,
        initialState: {
          baseLayer: 'street',
          tracks: false,
          confidence: true,
          numbers: false,
          heatmap: true,
          exclusion: false,
        },
      })

      expect(mapContainer.querySelector('#mlc-base-satellite') as HTMLInputElement).toBe(null)
      expect((mapContainer.querySelector('#mlc-base-street') as HTMLInputElement).checked).toBe(true)
      expect((mapContainer.querySelector('#mlc-tracks') as HTMLInputElement).checked).toBe(false)
      expect((mapContainer.querySelector('#mlc-confidence') as HTMLInputElement).checked).toBe(true)
      expect((mapContainer.querySelector('#mlc-numbers') as HTMLInputElement).checked).toBe(false)
    })

    it('applies the initial state to layer visibility', () => {
      const tracksNativeLayer = makeNativeLayer()
      const confidenceNativeLayer = makeNativeLayer()
      const numbersNativeLayer = makeNativeLayer()

      const opts = {
        ...makeOpts(makeMockMap()),
        tracksLayer: makeLayer('tracks', tracksNativeLayer),
        confidenceLayer: makeLayer('confidence', confidenceNativeLayer),
        numbersLayer: makeLayer('numbers', numbersNativeLayer),
      }

      new MapLayersControl({
        ...opts,
        initialState: {
          baseLayer: 'street',
          tracks: false,
          confidence: true,
          numbers: false,
          heatmap: true,
          exclusion: false,
        },
      })

      expect(tracksNativeLayer.setVisible).toHaveBeenCalledWith(false)
      expect(confidenceNativeLayer.setVisible).toHaveBeenCalledWith(true)
      expect(numbersNativeLayer.setVisible).toHaveBeenCalledWith(false)
    })
  })

  describe('when controls change', () => {
    it('calls onChange with the current state for checkbox changes', () => {
      const onChange = jest.fn()
      const opts = makeOpts(makeMockMap())
      mapContainer = opts.mapContainer

      new MapLayersControl({
        ...opts,
        initialState: {
          baseLayer: 'street',
          tracks: true,
          confidence: true,
          numbers: true,
          heatmap: true,
          exclusion: false,
        },
        onChange,
      })

      const tracks = mapContainer.querySelector('#mlc-tracks') as HTMLInputElement
      tracks.checked = false
      tracks.dispatchEvent(new Event('change'))

      expect(onChange).toHaveBeenCalledWith({
        baseLayer: 'street',
        tracks: false,
        confidence: true,
        numbers: true,
        heatmap: true,
        exclusion: false,
      })
    })

    // TODO: re-enable this test once the satelite option is added back
    it.skip('calls onChange with the current state for base layer changes', () => {
      const onChange = jest.fn()
      const opts = makeOpts(makeMockMap())
      mapContainer = opts.mapContainer

      new MapLayersControl({ ...opts, onChange })

      const satellite = mapContainer.querySelector('#mlc-base-satellite') as HTMLInputElement
      satellite.checked = true
      satellite.dispatchEvent(new Event('change'))

      expect(onChange).toHaveBeenCalledWith({
        baseLayer: 'satellite',
        tracks: true,
        confidence: true,
        numbers: true,
      })
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

  describe('focus management', () => {
    it('moves focus to the first focusable element in the panel when opened', () => {
      const closeBtn = mapContainer.querySelector('.mlc-panel__close') as HTMLElement
      closeBtn.click()

      const openBtn = mapContainer.querySelector('.mlc-open-btn') as HTMLElement

      const firstFocusable = mapContainer.querySelector<HTMLElement>(
        '.mlc-panel input, .mlc-panel button, .mlc-panel [href], .mlc-panel select, .mlc-panel textarea, .mlc-panel [tabindex]:not([tabindex="-1"])',
      )
      const focusSpy = jest.spyOn(firstFocusable!, 'focus')

      openBtn.click()
      expect(focusSpy).toHaveBeenCalled()
    })

    it('moves focus back to the open button when the panel is closed', () => {
      const openBtn = mapContainer.querySelector('.mlc-open-btn') as HTMLElement
      const focusSpy = jest.spyOn(openBtn, 'focus')

      const closeBtn = mapContainer.querySelector('.mlc-panel__close') as HTMLElement
      closeBtn.click()

      expect(focusSpy).toHaveBeenCalled()
    })
  })

  describe('enableHeatmap', () => {
    it('renders the heatmap checkbox when enableHeatmap is true', () => {
      const opts = makeOpts(makeMockMap())
      const localContainer = opts.mapContainer

      new MapLayersControl({ ...opts, enableHeatmap: true })

      expect(localContainer.querySelector('#mlc-heatmap')).toBeTruthy()
    })

    it('does not render the heatmap checkbox when enableHeatmap is false', () => {
      const opts = makeOpts(makeMockMap())
      const localContainer = opts.mapContainer

      new MapLayersControl({ ...opts, enableHeatmap: false })

      expect(localContainer.querySelector('#mlc-heatmap')).toBe(null)
    })

    it('does not bind or throw when heatmapLayer is provided but enableHeatmap is false', () => {
      const heatmapNativeLayer = makeNativeLayer()
      const opts = makeOpts(makeMockMap())

      expect(() => {
        new MapLayersControl({
          ...opts,
          enableHeatmap: false,
          heatmapLayer: makeLayer('heatmap', heatmapNativeLayer),
        })
      }).not.toThrow()

      expect(heatmapNativeLayer.setVisible).not.toHaveBeenCalled()
    })

    it('applies the initial heatmap state to the heatmap layer visibility when enabled', () => {
      const heatmapNativeLayer = makeNativeLayer()
      const opts = makeOpts(makeMockMap())

      new MapLayersControl({
        ...opts,
        enableHeatmap: true,
        heatmapLayer: makeLayer('heatmap', heatmapNativeLayer),
        initialState: {
          baseLayer: 'street',
          tracks: true,
          confidence: true,
          numbers: true,
          heatmap: true,
          exclusion: false,
        },
      })

      expect(heatmapNativeLayer.setVisible).toHaveBeenCalledWith(true)
    })

    it('calls onChange with updated heatmap state when the heatmap checkbox changes', () => {
      const onChange = jest.fn()
      const heatmapNativeLayer = makeNativeLayer()
      const opts = makeOpts(makeMockMap())
      const localContainer = opts.mapContainer

      new MapLayersControl({
        ...opts,
        enableHeatmap: true,
        heatmapLayer: makeLayer('heatmap', heatmapNativeLayer),
        initialState: {
          baseLayer: 'street',
          tracks: true,
          confidence: true,
          numbers: true,
          heatmap: false,
          exclusion: false,
        },
        onChange,
      })

      const heatmap = localContainer.querySelector('#mlc-heatmap') as HTMLInputElement
      heatmap.checked = true
      heatmap.dispatchEvent(new Event('change'))

      expect(heatmapNativeLayer.setVisible).toHaveBeenCalledWith(true)
      expect(onChange).toHaveBeenCalledWith({
        baseLayer: 'street',
        tracks: true,
        confidence: true,
        numbers: true,
        heatmap: true,
        exclusion: false,
      })
    })
  })

  describe('enableExclusionZones', () => {
    it('should render the exclusion checkbox when enableExclusionZones is true', () => {
      const opts = makeOpts(makeMockMap())
      const localContainer = opts.mapContainer

      new MapLayersControl({ ...opts, enableExclusionZones: true })

      expect(localContainer.querySelector('#mlc-exclusion')).toBeTruthy()
    })

    it('does not render the exclusion checkbox when enableExclusionZones is false', () => {
      const opts = makeOpts(makeMockMap())
      const localContainer = opts.mapContainer

      new MapLayersControl({ ...opts, enableExclusionZones: false })

      expect(localContainer.querySelector('#mlc-exclusion')).toBe(null)
    })

    it('does not bind or throw when exclusionLayer is provided but enableExclusionZones is false', () => {
      const exclusionLayer = makeBaseLayer()
      const opts = makeOpts(makeMockMap())

      expect(() => {
        new MapLayersControl({
          ...opts,
          enableExclusionZones: false,
          exclusionLayer: exclusionLayer as unknown as BaseLayer,
        })
      }).not.toThrow()

      expect(exclusionLayer.setVisible).not.toHaveBeenCalled()
    })

    it('applies the initial exclusion state to the exclusion layer visibility when enabled', () => {
      const exclusionLayer = makeBaseLayer()
      const opts = makeOpts(makeMockMap())

      new MapLayersControl({
        ...opts,
        enableExclusionZones: true,
        exclusionLayer: exclusionLayer as unknown as BaseLayer,
        initialState: {
          baseLayer: 'street',
          tracks: true,
          confidence: true,
          numbers: true,
          heatmap: true,
          exclusion: true,
        },
      })

      expect(exclusionLayer.setVisible).toHaveBeenCalledWith(true)
    })

    it('calls onChange with updated exclusion state when the exclusion checkbox changes', () => {
      const onChange = jest.fn()
      const exclusionLayer = makeBaseLayer()
      const opts = makeOpts(makeMockMap())
      const localContainer = opts.mapContainer

      new MapLayersControl({
        ...opts,
        enableExclusionZones: true,
        exclusionLayer: exclusionLayer as unknown as BaseLayer,
        initialState: {
          baseLayer: 'street',
          tracks: true,
          confidence: true,
          numbers: true,
          heatmap: true,
          exclusion: false,
        },
        onChange,
      })

      const exclusion = localContainer.querySelector('#mlc-exclusion') as HTMLInputElement
      exclusion.checked = true
      exclusion.dispatchEvent(new Event('change'))

      expect(exclusionLayer.setVisible).toHaveBeenCalledWith(true)
      expect(onChange).toHaveBeenCalledWith({
        baseLayer: 'street',
        tracks: true,
        confidence: true,
        numbers: true,
        heatmap: true,
        exclusion: true,
      })
    })
  })
})
