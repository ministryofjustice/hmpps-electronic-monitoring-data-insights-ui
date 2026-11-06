/**
 * @jest-environment jsdom
 */

import '@testing-library/jest-dom'
import { EmMap } from '@ministryofjustice/hmpps-electronic-monitoring-components/map'
import { ComposableLayer } from '@ministryofjustice/hmpps-electronic-monitoring-components/map/layers'
import type BaseLayer from 'ol/layer/Base'
import MapLayersControl, { HeatmapLevel } from './mapLayersControls'
import { heatmapLevelKeys, heatmapLevelLabels, heatmapLevelColours } from './heatmapLevels'

type ControlOptions = ConstructorParameters<typeof MapLayersControl>[0]
const defaultHeatmapLevels: Record<HeatmapLevel, boolean> = { veryHigh: true, high: true, medium: true, low: true }
const allLevels: HeatmapLevel[] = ['veryHigh', 'high', 'medium', 'low']

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

const makeLayer = (id: string, nativeLayer: unknown = makeNativeLayer()): ComposableLayer<BaseLayer | BaseLayer[]> =>
  ({
    id,
    getNativeLayer: jest.fn(() => nativeLayer),
    getPrimaryLayer: jest.fn(() => nativeLayer),
    attach: jest.fn(),
    detach: jest.fn(),
  }) as unknown as ComposableLayer<BaseLayer | BaseLayer[]>

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

const setupHeatmap = (extra: Partial<ControlOptions> = {}) => {
  const opts = makeOpts(makeMockMap())
  const onChange = jest.fn()
  const onHeatmapLevelsChange = jest.fn()
  new MapLayersControl({
    ...opts,
    enableHeatmap: true,
    heatmapLayer: makeLayer('heatmap'),
    onChange,
    onHeatmapLevelsChange,
    ...extra,
  })
  return { container: opts.mapContainer, onChange, onHeatmapLevelsChange }
}

const levelInput = (container: HTMLElement, level: HeatmapLevel) =>
  container.querySelector<HTMLInputElement>(`#mlc-heatmap-${level}`)!

const uncheck = (input: HTMLInputElement) => {
  // eslint-disable-next-line no-param-reassign
  input.checked = false
  input.dispatchEvent(new Event('change'))
}

const check = (input: HTMLInputElement) => {
  // eslint-disable-next-line no-param-reassign
  input.checked = true
  input.dispatchEvent(new Event('change'))
}

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

    it('exposes the map controls as an expanded labelled region', () => {
      const panel = mapContainer.querySelector('.mlc-panel') as HTMLElement
      const closeBtn = mapContainer.querySelector('.mlc-panel__close') as HTMLElement

      expect(panel).toHaveAttribute('id', 'map-controls-panel')
      expect(panel).toHaveAttribute('role', 'region')
      expect(panel).toHaveAttribute('aria-label', 'Map controls')
      expect(closeBtn).toHaveAttribute('aria-controls', 'map-controls-panel')
      expect(closeBtn).toHaveAttribute('aria-expanded', 'true')
    })

    it('hides decorative dividers from assistive technology', () => {
      const dividers = mapContainer.querySelectorAll('.mlc-panel__divider')

      expect(dividers).toHaveLength(1)
      dividers.forEach(divider => expect(divider).toHaveAttribute('aria-hidden', 'true'))
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
        heatmapLevels: defaultHeatmapLevels,
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
      expect(panel.hasAttribute('data-hidden')).toBe(true)
    })

    it('shows the open button', () => {
      const openBtn = mapContainer.querySelector('.mlc-open-btn') as HTMLElement
      expect(openBtn.hasAttribute('data-hidden')).toBe(false)
    })

    it('exposes the collapsed state on the open button', () => {
      const openBtn = mapContainer.querySelector('.mlc-open-btn') as HTMLElement

      expect(openBtn).toHaveAttribute('aria-controls', 'map-controls-panel')
      expect(openBtn).toHaveAttribute('aria-expanded', 'false')
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

    it('exposes the expanded state on the close button', () => {
      const closeBtn = mapContainer.querySelector('.mlc-panel__close') as HTMLElement

      expect(closeBtn).toHaveAttribute('aria-expanded', 'true')
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
    it('renders the activity levels without a master checkbox when enableHeatmap is true', () => {
      const opts = makeOpts(makeMockMap())
      const localContainer = opts.mapContainer

      new MapLayersControl({ ...opts, enableHeatmap: true })

      expect(localContainer.querySelector('#mlc-heatmap')).toBeNull()
      expect(localContainer.querySelectorAll('[data-heatmap-level]')).toHaveLength(4)
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

    it('uses the selected levels even when the previous master state was off', () => {
      const heatmapNativeLayer = makeNativeLayer()

      setupHeatmap({
        heatmapLayer: makeLayer('heatmap', heatmapNativeLayer),
        initialState: { heatmap: false },
      })

      expect(heatmapNativeLayer.setVisible).toHaveBeenCalledWith(true)
    })

    it('calls onChange with the derived heatmap state on initialisation', () => {
      const onChange = jest.fn()
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
          heatmap: false,
          exclusion: false,
        },
        onChange,
      })

      expect(heatmapNativeLayer.setVisible).toHaveBeenCalledWith(true)
      expect(onChange).toHaveBeenCalledWith({
        baseLayer: 'street',
        tracks: true,
        heatmapLevels: defaultHeatmapLevels,
        confidence: true,
        numbers: true,
        heatmap: true,
        exclusion: false,
      })
    })
  })

  describe('heatmap section', () => {
    const trigger = (container: HTMLElement) => container.querySelector('.mlc-collapsible-trigger') as HTMLButtonElement

    const content = (container: HTMLElement) => container.querySelector('#mlc-heatmap-content') as HTMLElement

    it('renders a button trigger that controls the heatmap content', () => {
      const { container } = setupHeatmap()

      expect(trigger(container)).toBeTruthy()
      expect(trigger(container)).toHaveAttribute('type', 'button')
      expect(trigger(container)).toHaveTextContent('Heatmap')
      expect(trigger(container)).toHaveAttribute('aria-controls', 'mlc-heatmap-content')
      expect(content(container)).toBeTruthy()
    })

    it('does not render the section when enableHeatmap is false', () => {
      const { container } = setupHeatmap({ enableHeatmap: false })

      expect(trigger(container)).toBe(null)
      expect(content(container)).toBe(null)
    })

    it('starts expanded when the heatmap is on', () => {
      const { container } = setupHeatmap()

      expect(trigger(container)).toHaveAttribute('aria-expanded', 'true')
      expect(content(container).hasAttribute('hidden')).toBe(false)
    })

    it('keeps the activity levels expanded and usable when the previous master state was off', () => {
      const { container } = setupHeatmap({ initialState: { heatmap: false } })

      expect(trigger(container)).toHaveAttribute('aria-expanded', 'true')
      expect(content(container).hasAttribute('hidden')).toBe(false)
      expect(container.querySelector('#mlc-heatmap')).toBeNull()
      allLevels.forEach(level => expect(levelInput(container, level)).toBeTruthy())
    })

    it('collapses and expands when the trigger is clicked', () => {
      const { container } = setupHeatmap()

      trigger(container).click()
      expect(trigger(container)).toHaveAttribute('aria-expanded', 'false')
      expect(content(container).hasAttribute('hidden')).toBe(true)

      trigger(container).click()
      expect(trigger(container)).toHaveAttribute('aria-expanded', 'true')
      expect(content(container).hasAttribute('hidden')).toBe(false)
    })

    it('does not change any control state or notify when collapsed', () => {
      const { container, onChange } = setupHeatmap()
      uncheck(levelInput(container, 'high'))
      onChange.mockClear()

      trigger(container).click()

      expect(onChange).not.toHaveBeenCalled()
      expect(levelInput(container, 'high').checked).toBe(false)
      expect(container.querySelector('#mlc-heatmap')).toBeNull()
    })

    it('adds a decorative divider before the section', () => {
      const { container } = setupHeatmap()
      const dividers = container.querySelectorAll('.mlc-panel__divider')

      expect(dividers).toHaveLength(2)
      dividers.forEach(divider => expect(divider).toHaveAttribute('aria-hidden', 'true'))
    })
  })

  describe('heatmap levels', () => {
    it('renders a checked checkbox for each level by default', () => {
      const { container } = setupHeatmap()

      allLevels.forEach(level => {
        expect(levelInput(container, level)).toBeTruthy()
        expect(levelInput(container, level).checked).toBe(true)
      })
    })

    it('does not render level checkboxes when enableHeatmap is false', () => {
      const { container } = setupHeatmap({ enableHeatmap: false })

      allLevels.forEach(level => {
        expect(levelInput(container, level)).toBe(null)
      })
    })

    it('labels each level with its shared label, in the shared order', () => {
      const { container } = setupHeatmap()

      const renderedOrder = Array.from(container.querySelectorAll<HTMLInputElement>('[data-heatmap-level]')).map(
        input => input.dataset.heatmapLevel,
      )
      expect(renderedOrder).toEqual(heatmapLevelKeys)

      heatmapLevelKeys.forEach(level => {
        const label = container.querySelector(`label[for="mlc-heatmap-${level}"]`) as HTMLElement
        expect(label.textContent?.trim()).toBe(heatmapLevelLabels[level])
      })
    })

    it('colours each swatch from the shared palette and hides it from assistive technology', () => {
      const { container } = setupHeatmap()

      heatmapLevelKeys.forEach(level => {
        const swatch = container.querySelector(`[data-swatch-level="${level}"]`) as HTMLElement
        expect(swatch).toHaveAttribute('aria-hidden', 'true')
        expect(swatch).toHaveStyle({ backgroundColor: heatmapLevelColours[level] })
      })
    })

    it('merges a partial initial heatmapLevels with the defaults', () => {
      const { container } = setupHeatmap({ initialState: { heatmapLevels: { low: false } } })

      expect(levelInput(container, 'low').checked).toBe(false)
      expect(levelInput(container, 'veryHigh').checked).toBe(true)
      expect(levelInput(container, 'high').checked).toBe(true)
      expect(levelInput(container, 'medium').checked).toBe(true)
    })

    it('reports the enabled levels on initial render', () => {
      const { onHeatmapLevelsChange } = setupHeatmap({ initialState: { heatmapLevels: { low: false } } })

      expect(onHeatmapLevelsChange).toHaveBeenCalledTimes(1)
      expect(onHeatmapLevelsChange).toHaveBeenCalledWith({ ...defaultHeatmapLevels, low: false })
    })

    it('does not report levels when enableHeatmap is false', () => {
      const { onHeatmapLevelsChange } = setupHeatmap({ enableHeatmap: false })

      expect(onHeatmapLevelsChange).not.toHaveBeenCalled()
    })

    it('keeps the level checkboxes enabled when the previous master state was off', () => {
      const { container } = setupHeatmap({ initialState: { heatmap: false } })

      allLevels.forEach(level => {
        expect(levelInput(container, level).disabled).toBe(false)
      })
    })

    it('updates state and notifies when a level is toggled', () => {
      const { container, onChange, onHeatmapLevelsChange } = setupHeatmap()

      uncheck(levelInput(container, 'high'))

      expect(onHeatmapLevelsChange).toHaveBeenLastCalledWith({ ...defaultHeatmapLevels, high: false })
      expect(onChange).toHaveBeenLastCalledWith(
        expect.objectContaining({ heatmapLevels: { ...defaultHeatmapLevels, high: false } }),
      )
    })

    it('keeps earlier toggles when another level changes', () => {
      const { container, onHeatmapLevelsChange } = setupHeatmap()

      uncheck(levelInput(container, 'low'))
      uncheck(levelInput(container, 'medium'))

      expect(onHeatmapLevelsChange).toHaveBeenLastCalledWith({
        ...defaultHeatmapLevels,
        low: false,
        medium: false,
      })
    })

    it('reports a level being switched back on', () => {
      const { container, onHeatmapLevelsChange } = setupHeatmap({ initialState: { heatmapLevels: { low: false } } })

      check(levelInput(container, 'low'))

      expect(onHeatmapLevelsChange).toHaveBeenLastCalledWith(defaultHeatmapLevels)
    })

    it('keeps the heatmap visible while at least one level is selected', () => {
      const heatmapNativeLayer = makeNativeLayer()
      const { container } = setupHeatmap({ heatmapLayer: makeLayer('heatmap', heatmapNativeLayer) })
      heatmapNativeLayer.setVisible.mockClear()

      uncheck(levelInput(container, 'veryHigh'))

      expect(heatmapNativeLayer.setVisible).toHaveBeenLastCalledWith(true)
    })

    it('emits a copy of the levels so callers cannot mutate internal state', () => {
      const { container, onChange, onHeatmapLevelsChange } = setupHeatmap()

      uncheck(levelInput(container, 'low'))

      const emittedState = onChange.mock.calls[onChange.mock.calls.length - 1][0]
      const emittedLevels = onHeatmapLevelsChange.mock.calls[onHeatmapLevelsChange.mock.calls.length - 1][0]
      emittedState.heatmapLevels.low = true
      emittedLevels.low = true

      uncheck(levelInput(container, 'medium'))

      const expected = { ...defaultHeatmapLevels, low: false, medium: false }
      expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({ heatmapLevels: expected }))
      expect(onHeatmapLevelsChange).toHaveBeenLastCalledWith(expected)
    })

    it('hides the heatmap when all levels are cleared without disabling the controls', () => {
      const heatmapNativeLayer = makeNativeLayer()
      const { container, onChange } = setupHeatmap({ heatmapLayer: makeLayer('heatmap', heatmapNativeLayer) })

      allLevels.forEach(level => uncheck(levelInput(container, level)))

      allLevels.forEach(level => {
        expect(levelInput(container, level).disabled).toBe(false)
      })
      expect(heatmapNativeLayer.setVisible).toHaveBeenLastCalledWith(false)
      expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({ heatmap: false }))
    })

    it('shows the heatmap again when a level is selected', () => {
      const heatmapNativeLayer = makeNativeLayer()
      const { container, onChange } = setupHeatmap({
        heatmapLayer: makeLayer('heatmap', heatmapNativeLayer),
        initialState: { heatmapLevels: { veryHigh: false, high: false, medium: false, low: false } },
      })
      expect(heatmapNativeLayer.setVisible).toHaveBeenLastCalledWith(false)

      check(levelInput(container, 'low'))

      expect(heatmapNativeLayer.setVisible).toHaveBeenLastCalledWith(true)
      expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({ heatmap: true }))
    })

    it('remembers level selections while the section is collapsed and expanded', () => {
      const { container, onHeatmapLevelsChange } = setupHeatmap()
      const trigger = container.querySelector<HTMLButtonElement>('.mlc-collapsible-trigger')!

      uncheck(levelInput(container, 'high'))
      trigger.click()
      trigger.click()

      expect(levelInput(container, 'high').checked).toBe(false)
      expect(levelInput(container, 'veryHigh').checked).toBe(true)
      expect(onHeatmapLevelsChange).toHaveBeenLastCalledWith({ ...defaultHeatmapLevels, high: false })
    })

    it('does not share level state between instances', () => {
      const first = setupHeatmap()
      uncheck(levelInput(first.container, 'low'))

      const second = setupHeatmap()

      expect(second.onHeatmapLevelsChange).toHaveBeenCalledWith(defaultHeatmapLevels)
      expect(levelInput(second.container, 'low').checked).toBe(true)
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
        heatmapLevels: defaultHeatmapLevels,
        confidence: true,
        numbers: true,
        heatmap: true,
        exclusion: true,
      })
    })
  })
})
