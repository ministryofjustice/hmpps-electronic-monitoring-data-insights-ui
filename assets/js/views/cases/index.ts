import { EmMap } from '@ministryofjustice/hmpps-electronic-monitoring-components/map'
import {
  LocationsLayer,
  TracksLayer,
  CirclesLayer,
  TextLayer,
} from '@ministryofjustice/hmpps-electronic-monitoring-components/map/layers'

import XYZ from 'ol/source/XYZ'
import TileLayer from 'ol/layer/Tile'

import { isEmpty } from 'ol/extent'
import type VectorLayer from 'ol/layer/Vector'
import MapLayersControl from './controls/mapLayersControls'
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
  const mapContainer = queryElement(document, '[data-qa="em-map"]') as HTMLElement
  const emMap = queryElement(mapContainer, 'em-map') as unknown as EmMap

  const setupMap = () => {
    const map = emMap.olMapInstance
    if (!map) {
      setTimeout(setupMap, 200)
      return
    }

    const { positions } = emMap

    // TODO: Replace with OS API once approved
    const satelliteLayer = new TileLayer({
      source: new XYZ({
        url: 'https://api.os.uk/maps/raster/v1/zxy/Imagery_3857/{z}/{x}/{y}.png',
        attributions: 'Tiles © Ordnance Survey',
      }),
      visible: false,
    })

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
        fill: 'rgba(0, 0, 0, 0)',
        stroke: {
          color: 'rgba(76, 128, 182, 1)',
          width: 2,
        },
      },
    })
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

    emMap.addLayer(satelliteLayer)
    emMap.addLayer(locationsLayer)
    emMap.addLayer(tracksLayer)
    emMap.addLayer(confidenceLayer)
    emMap.addLayer(numbersLayer)

    emMap.fitToAllLayers({ padding: 80 })

    const lockControl = createLockRotationControl(emMap)
    map.addControl(lockControl)

    const mapLayersControl = new MapLayersControl({
      mapContainer,
      map: emMap,
      tracksLayer,
      confidenceLayer,
      numbersLayer,
      satelliteLayer,
    })
    map.addControl(mapLayersControl)

    emMap.dispatchEvent(
      new CustomEvent('app:map:layers:ready', {
        bubbles: true,
        composed: true,
        detail: { message: 'All custom layers added' },
      }),
    )

    const nativeLayer = locationsLayer.getNativeLayer()
    if (nativeLayer && Array.isArray(nativeLayer)) {
      const layer = nativeLayer[0] as VectorLayer
      const locationSource = layer?.getSource?.()
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
    }

    if (document.querySelector('#map-pan-announce')) {
      initialiseDirectionScreenReader()
    }
  }

  setupMap()
}

export default initialiseLocationDataView
