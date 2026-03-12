import { EmMap } from '@ministryofjustice/hmpps-electronic-monitoring-components/map'
import {
  LocationsLayer,
  TracksLayer,
  CirclesLayer,
  TextLayer,
} from '@ministryofjustice/hmpps-electronic-monitoring-components/map/layers'
import { isEmpty } from 'ol/extent'
import createLayerVisibilityToggle from './controls/layerVisibilityToggle'
import getRotatedDirection from './controls/getRotatedDirection'
import createLockRotationControl from './controls/createLockRotationControl'
import { queryElement } from '../../utils/utils'

const initialiseDirectionScreenReader = () => {
  const emMap = queryElement(document, 'em-map') as EmMap
  const panAnnounce = queryElement(document, '#map-pan-announce') as HTMLElement

  const viewport = emMap.olMapInstance?.getViewport()

  viewport?.addEventListener('keydown', (e: KeyboardEvent) => {
    const rotation = emMap.olMapInstance?.getView().getRotation() ?? 0
    const label = getRotatedDirection(e.key, rotation)
    if (label && panAnnounce) {
      panAnnounce.textContent = label
    }
  })

  emMap.olMapInstance?.getViewport().addEventListener('mouseup', () => {
    const rotation = emMap.olMapInstance?.getView().getRotation() ?? 0
    const label = getRotatedDirection('ArrowUp', rotation)
    if (label && panAnnounce) {
      panAnnounce.textContent = label
    }
  })
}

const initialiseLocationDataView = () => {
  const emMap = queryElement(document, 'em-map') as EmMap
  const setupMap = () => {
    const map = emMap.olMapInstance
    if (!map) {
      setTimeout(setupMap, 200)
      return
    }

    const { positions } = emMap
    const locationsLayer = emMap.addLayer(
      new LocationsLayer({
        title: 'pointsLayer',
        positions,
        zIndex: 4,
      }),
    )!

    const lockControl = createLockRotationControl(emMap)
    map.addControl(lockControl)

    const tracksLayer = emMap.addLayer(
      new TracksLayer({
        title: 'tracksLayer',
        positions,
        visible: true,
        zIndex: 1,
      }),
    )!

    const confidenceLayer = emMap.addLayer(
      new CirclesLayer({
        positions,
        id: 'confidence',
        title: 'confidenceLayer',
        visible: false,
        zIndex: 3,
        style: {
          fill: null,
          stroke: {
            color: 'rgba(242, 201, 76, 1)',
            lineDash: [8, 8],
            width: 2,
          },
        },
      }),
    )

    const numbersLayer = emMap.addLayer(
      new TextLayer({
        positions,
        textProperty: 'sequenceNumber',
        title: 'numberingLayer',
        visible: false,
        zIndex: 3,
      }),
    )

    emMap.dispatchEvent(
      new CustomEvent('app:map:layers:ready', {
        bubbles: true,
        composed: true,
        detail: { message: 'All custom layers added' },
      }),
    )

    const locationSource = locationsLayer?.getSource()

    if (locationSource) {
      const extent = locationSource.getExtent()
      if (isEmpty(extent) === false) {
        map.getView().fit(extent, {
          maxZoom: 20,
          padding: [30, 30, 30, 30],
          size: map.getSize(),
        })
      }
    }

    if (document.querySelector('#map-pan-announce')) {
      initialiseDirectionScreenReader()
    }
    // Add controls
    if (locationsLayer) createLayerVisibilityToggle('#locations', locationsLayer, emMap)
    if (tracksLayer) createLayerVisibilityToggle('#tracks', tracksLayer, emMap)
    if (confidenceLayer) createLayerVisibilityToggle('#confidence', confidenceLayer)
    if (numbersLayer) createLayerVisibilityToggle('#numbering', numbersLayer)
  }

  setupMap()
}

export default initialiseLocationDataView