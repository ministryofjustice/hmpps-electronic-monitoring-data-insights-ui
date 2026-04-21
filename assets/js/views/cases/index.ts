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

  viewport?.addEventListener('mouseup', () => {
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
        style: {
          fill: 'rgba(76, 128, 182, 1)',
          stroke: {
            color: 'rgba(76, 128, 182, 1)',
          },
        },
      }),
    )!

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
        visible: true,
        zIndex: 3,
        style: {
          fill: 'rgba(0, 0, 0, 0)',
          stroke: {
            color: 'rgba(76, 128, 182, 1)',
            width: 2,
          },
        },
      }),
    )

    const numbersLayer = new TextLayer({
      positions,
      textProperty: 'displayPointNumber',
      id: 'numbersLayer',
      title: 'numbersLayer',
      visible: true,
      zIndex: 3,
      style: {
        offset: { x: 0, y: 30 },
        textAlign: 'center',
      },
    })

    emMap.addLayer(locationsLayer)
    emMap.addLayer(tracksLayer)
    emMap.addLayer(confidenceLayer)
    emMap.addLayer(numbersLayer)

    emMap.fitToAllLayers({ padding: 80 })

    const lockControl = createLockRotationControl(emMap)
    map.addControl(lockControl)

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
      if (!isEmpty(extent)) {
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

    if (locationsLayer) createLayerVisibilityToggle('#locations', locationsLayer, emMap)
    if (tracksLayer) createLayerVisibilityToggle('#tracks', tracksLayer, emMap)
    if (confidenceLayer) createLayerVisibilityToggle('#confidence', confidenceLayer, emMap)
    if (numbersLayer) createLayerVisibilityToggle('#numbering', numbersLayer, emMap)
  }

  setupMap()
}

export default initialiseLocationDataView
