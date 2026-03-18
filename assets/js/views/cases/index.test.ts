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
}

jest.mock('@ministryofjustice/hmpps-electronic-monitoring-components/map', () => ({}))
jest.mock('@ministryofjustice/hmpps-electronic-monitoring-components/map/layers', () => ({
  LocationsLayer: jest.fn().mockImplementation(() => ({
    getSource: jest.fn(() => ({
      getExtent: jest.fn(() => [0, 0, 100, 100]),
    })),
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
  let mockEmMap: MockEmMapElement
  let mockMap: MockOlMapInstance

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
    }

    const emMapStub = mockEmMap as unknown as EmMap

    ;(utils.queryElement as jest.Mock).mockReturnValue(emMapStub)
  })

  afterEach(() => {
    jest.clearAllMocks()
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
    expect(CirclesLayer).toHaveBeenCalled()
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
})
