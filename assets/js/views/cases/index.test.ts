/**
 * @jest-environment jsdom
 */

import {
  LocationsLayer,
  TracksLayer,
  CirclesLayer,
  TextLayer,
} from '@ministryofjustice/hmpps-electronic-monitoring-components/map/layers'
import { EmMap } from '@ministryofjustice/hmpps-electronic-monitoring-components/map'
import initialiseLocationDataView from './index'
import * as utils from '../../utils/utils'

interface MockOlMapInstance {
  addControl: jest.Mock
  getView: jest.Mock
  getSize: jest.Mock
  getViewport: jest.Mock
}

interface MockEmMapElement {
  olMapInstance: MockOlMapInstance | null
  positions: unknown[]
  addLayer: jest.Mock
  dispatchEvent: jest.Mock
  fitToAllLayers: jest.Mock
  getNativeLayer: jest.Mock
}

interface MockShadowRoot {
  adoptedStyleSheets: CSSStyleSheet[]
  querySelector: jest.Mock
}

interface MockEmMapWithShadow extends MockEmMapElement {
  shadowRoot: MockShadowRoot | null
}

jest.mock('./controls/mapLayersControls', () => jest.fn().mockImplementation(() => ({})))
jest.mock('@ministryofjustice/hmpps-electronic-monitoring-components/map', () => ({}))
jest.mock('@ministryofjustice/hmpps-electronic-monitoring-components/map/layers', () => ({
  LocationsLayer: jest.fn().mockImplementation(() => ({
    getNativeLayer: jest.fn(() => [
      {
        getSource: jest.fn(() => ({
          getExtent: jest.fn(() => [0, 0, 100, 100]),
        })),
      },
    ]),
  })),
  TracksLayer: jest.fn().mockImplementation(() => ({})),
  CirclesLayer: jest.fn().mockImplementation(() => ({})),
  TextLayer: jest.fn().mockImplementation(() => ({})),
}))

jest.mock('ol/extent', () => ({ isEmpty: jest.fn(() => true) }))
jest.mock('./controls/layerVisibilityToggle', () => jest.fn())
jest.mock('./controls/createLockRotationControl', () => jest.fn(() => ({})))
jest.mock('./controls/getRotatedDirection', () => jest.fn())
jest.mock('../../utils/utils')

describe('initialiseLocationDataView', () => {
  let mockEmMap: MockEmMapWithShadow
  let mockMap: MockOlMapInstance
  const mockCompassReset = { setAttribute: jest.fn() }
  const mockZoomSliderThumb = { setAttribute: jest.fn() }

  beforeEach(() => {
    mockMap = {
      addControl: jest.fn(),
      getView: jest.fn(() => ({
        fit: jest.fn(),
        getRotation: jest.fn(() => 0),
      })),
      getSize: jest.fn(() => [800, 600]),
      getViewport: jest.fn(() => ({
        addEventListener: jest.fn(),
      })),
    }

    mockEmMap = {
      olMapInstance: mockMap,
      positions: [],
      addLayer: jest.fn((layer: unknown) => layer),
      dispatchEvent: jest.fn(),
      fitToAllLayers: jest.fn(),
      getNativeLayer: jest.fn(),
      shadowRoot: {
        adoptedStyleSheets: [],
        querySelector: jest.fn(),
      },
    }
    ;(utils.queryElement as jest.Mock).mockImplementation((_root: unknown, selector: string) => {
      if (selector === '.ol-rotate-reset') return mockCompassReset
      if (selector === '.ol-zoomslider-thumb') return mockZoomSliderThumb
      return mockEmMap as unknown as EmMap
    })
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  const mockReplaceSync = jest.fn()
  beforeAll(() => {
    global.CSSStyleSheet = jest.fn().mockImplementation(() => ({
      replaceSync: mockReplaceSync,
    })) as unknown as typeof CSSStyleSheet
  })

  it('should add a LocationsLayer to the map', () => {
    initialiseLocationDataView()
    expect(LocationsLayer).toHaveBeenCalled()
  })

  it('should add TracksLayer with visible set to true', () => {
    initialiseLocationDataView()
    expect(TracksLayer).toHaveBeenCalledWith(expect.objectContaining({ visible: true }))
  })

  it('should add a CirclesLayer to the map', () => {
    initialiseLocationDataView()
    expect(CirclesLayer).toHaveBeenCalledWith(expect.objectContaining({ visible: true }))
  })

  it('should add a TextLayer to the map', () => {
    initialiseLocationDataView()
    expect(TextLayer).toHaveBeenCalled()
  })

  it('should add lock rotation control to the map', () => {
    initialiseLocationDataView()
    expect(mockMap.addControl).toHaveBeenCalled()
  })

  it('should dispatch app:map:layers:ready event', () => {
    initialiseLocationDataView()
    expect(mockEmMap.dispatchEvent).toHaveBeenCalledWith(expect.objectContaining({ type: 'app:map:layers:ready' }))
  })

  it('should retry setupMap if olMapInstance is not ready', () => {
    jest.useFakeTimers()

    mockEmMap.olMapInstance = null

    initialiseLocationDataView()
    expect(mockEmMap.dispatchEvent).not.toHaveBeenCalled()

    mockEmMap.olMapInstance = mockMap
    jest.advanceTimersByTime(200)

    expect(mockEmMap.dispatchEvent).toHaveBeenCalled()
    jest.useRealTimers()
  })

  describe('injectShadowFocusStyles', () => {
    it('should not throw if shadowRoot is null', () => {
      mockEmMap.shadowRoot = null
      expect(() => initialiseLocationDataView()).not.toThrow()
    })

    it('should include MoJ focus styles in the injected stylesheet', () => {
      initialiseLocationDataView()
      expect(mockReplaceSync).toHaveBeenCalledWith(expect.stringContaining(':host .ol-zoom-in:focus'))
      expect(mockReplaceSync).toHaveBeenCalledWith(expect.stringContaining('outline: 3px solid #ffdd00 !important'))
      expect(mockReplaceSync).toHaveBeenCalledWith(expect.stringContaining(':focus:not(:focus-visible)'))
    })

    it('should preserve any existing stylesheets on the shadow root', () => {
      const existingSheet = new CSSStyleSheet()
      ;(mockEmMap.shadowRoot as MockShadowRoot).adoptedStyleSheets = [existingSheet]
      initialiseLocationDataView()
      const { adoptedStyleSheets } = mockEmMap.shadowRoot as MockShadowRoot
      expect(adoptedStyleSheets).toHaveLength(2)
      expect(adoptedStyleSheets[0]).toBe(existingSheet)
    })
  })

  describe('shadow DOM aria labels', () => {
    it('should set aria-label on compass reset button', () => {
      initialiseLocationDataView()
      expect(mockCompassReset.setAttribute).toHaveBeenCalledWith('aria-label', 'Reset map orientation to north')
    })

    it('should set aria-label on zoom slider thumb', () => {
      initialiseLocationDataView()
      expect(mockZoomSliderThumb.setAttribute).toHaveBeenCalledWith('aria-label', 'Adjust map zoom')
    })
  })
})
