import { EmMap } from '@ministryofjustice/hmpps-electronic-monitoring-components/map'
import {
  LocationsLayer,
  TracksLayer,
  CirclesLayer,
  TextLayer,
} from '@ministryofjustice/hmpps-electronic-monitoring-components/map/layers'
import getRotatedDirection from './controls/getRotatedDirection'
import createLockRotationControl from './controls/createLockRotationControl'
import { queryElement } from '../../utils/utils'
import MapLayersControl from './controls/mapLayersControl'

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

    const tracksLayer = new TracksLayer({
      id: 'tracksLayer',
      positions,
      visible: true,
      zIndex: 1,
    })

    const confidenceLayer = new CirclesLayer({
      positions,
      id: 'confidenceLayer',
      title: 'confidenceLayer',
      visible: true,
      zIndex: 3,
      style: {
        fill: 'rgba(76, 128, 182, 0.1)',
        stroke: {
          color: 'rgba(76, 128, 182, 1)',
          width: 2,
        },
      },
    })

    const numbersLayer = new TextLayer({
      positions,
      textProperty: 'precision',
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
    const lockControl = createLockRotationControl(emMap)
    map.addControl(lockControl)

    emMap.dispatchEvent(
      new CustomEvent('app:map:layers:ready', {
        bubbles: true,
        composed: true,
        detail: { message: 'All custom layers added' },
      }),
    )

    emMap.fitToAllLayers({ padding: 80 })

    if (document.querySelector('#map-pan-announce')) {
      initialiseDirectionScreenReader()
    }

    const mapContainer = queryElement(document, '.em-map') as HTMLElement

    const layersControl = new MapLayersControl({
      tracksLayer,
      confidenceLayer: confidenceLayer ?? undefined,
      numbersLayer: numbersLayer ?? undefined,
      mapContainer,
      map: emMap,
    })
    map.addControl(layersControl)
  }

  setupMap()
}

export default initialiseLocationDataView
