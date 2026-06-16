import { EmMap, Position } from '@ministryofjustice/hmpps-electronic-monitoring-components/map'
import {
  LocationsLayer,
  TracksLayer,
  CirclesLayer,
  TextLayer,
} from '@ministryofjustice/hmpps-electronic-monitoring-components/map/layers'
import { isEmpty } from 'ol/extent'
import VectorLayer from 'ol/layer/Vector'
import HeatmapLayer from 'ol/layer/Heatmap'
import VectorSource from 'ol/source/Vector'
import { Feature } from 'ol'
import { Point } from 'ol/geom'
import { fromLonLat } from 'ol/proj'
import { queryElement } from '../../utils/utils'
import createLockRotationControl from './controls/createLockRotationControl'
import getRotatedDirection from './controls/getRotatedDirection'
import MapLayersControl, { MapControlState } from './controls/mapLayersControls'

interface ShadowRootHost extends HTMLElement {
  shadowRoot: ShadowRoot | null
}

export interface TrackPosition extends Position {
  gpsDate?: string
}

const TIME_GAP_THRESHOLD_MINS = 50
const getShadowRoot = (emMap: EmMap): ShadowRoot | null => (emMap as ShadowRootHost).shadowRoot

const defaultMapControlState: MapControlState = {
  baseLayer: 'street',
  tracks: true,
  confidence: true,
  numbers: true,
}

const parseBooleanDataValue = (value: string | undefined): boolean | undefined => {
  if (value === 'true') return true
  if (value === 'false') return false
  return undefined
}

const getInitialMapControlState = (mapContainer: HTMLElement): MapControlState => ({
  baseLayer: mapContainer.dataset.mapControlBaseLayer === 'satellite' ? 'satellite' : 'street',
  tracks: parseBooleanDataValue(mapContainer.dataset.mapControlTracks) ?? defaultMapControlState.tracks,
  confidence: parseBooleanDataValue(mapContainer.dataset.mapControlConfidence) ?? defaultMapControlState.confidence,
  numbers: parseBooleanDataValue(mapContainer.dataset.mapControlNumbers) ?? defaultMapControlState.numbers,
})

const syncMapControlInputs = (state: MapControlState) => {
  ;(Object.keys(state) as Array<keyof MapControlState>).forEach(key => {
    const input = document.querySelector<HTMLInputElement>(`[data-map-control-input="${key}"]`)
    if (input) {
      input.value = String(state[key])
    }
  })
}

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

const injectShadowFocusStyles = (emMap: EmMap) => {
  const shadowRoot = getShadowRoot(emMap)
  if (!shadowRoot) return

  const sheet = new CSSStyleSheet()
  sheet.replaceSync(`
     :host .ol-control button:focus,
     :host .ol-zoom-in:focus,
     :host .ol-zoom-out:focus {
       color: #0b0c0c !important;
       outline: 3px solid #ffdd00 !important;
       outline-offset: 0 !important;
       box-shadow: inset 0 0 0 2px !important;
       text-decoration: none;
     }

     :host .ol-control button:focus:not(:focus-visible),
     :host .ol-zoom-in:focus:not(:focus-visible),
     :host .ol-zoom-out:focus:not(:focus-visible) {
       background-color: revert;
       box-shadow: none;
       color: revert;
     }
   `)
  shadowRoot.adoptedStyleSheets = [...shadowRoot.adoptedStyleSheets, sheet]
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
    injectShadowFocusStyles(emMap as EmMap)
    const { positions } = emMap
    const mapControlState = getInitialMapControlState(mapContainer)
    syncMapControlInputs(mapControlState)

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

    const getTimestamp = (position: Position): number | null => {
      const ts = (position as TrackPosition).gpsDate
      if (!ts) return null
      return new Date(ts).getTime()
    }

    const shouldDash = (from: Position, to: Position): boolean => {
      const t1 = getTimestamp(from)
      const t2 = getTimestamp(to)
      if (t1 === null || t2 === null) return false
      const diffMinutes = (t2 - t1) / 60000
      return diffMinutes > TIME_GAP_THRESHOLD_MINS
    }

    const tracksLayer = new TracksLayer({
      id: 'tracksLayer',
      positions,
      visible: mapControlState.tracks,
      zIndex: 1,
      style: { stroke: { color: 'rgba(76, 128, 182, 1)' } },
      segmentStyle: ({ positions: [from, to] }) => ({
        stroke: {
          lineDash: shouldDash(from, to) ? [8, 6] : undefined,
        },
      }),
    })

    const confidenceLayer = new CirclesLayer({
      positions,
      id: 'confidenceLayer',
      title: 'confidenceLayer',
      visible: mapControlState.confidence,
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
      visible: mapControlState.numbers,
      zIndex: 3,
      style: {
        offset: { x: 0, y: 30 },
        textAlign: 'center',
      },
    })

    if (mapContainer.dataset.enableHeatmap === 'true') {
      const heatmapSource = new VectorSource({
        features: positions.map(
          position =>
            new Feature({
              geometry: new Point(
                fromLonLat([(position as TrackPosition).longitude, (position as TrackPosition).latitude]),
              ),
            }),
        ),
      })

      const heatmapLayer = new HeatmapLayer({
        source: heatmapSource,
        blur: 15,
        radius: 10,
        zIndex: 2,
      })
      emMap.addLayer(heatmapLayer)
    }

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
      initialState: mapControlState,
      onChange: syncMapControlInputs,
    })
    map.addControl(mapLayersControl)

    emMap.dispatchEvent(
      new CustomEvent('app:map:layers:ready', {
        bubbles: true,
        composed: true,
        detail: { message: 'All custom layers added' },
      }),
    )
    const shadowRoot = getShadowRoot(emMap)
    if (!shadowRoot) return

    const compassReset = queryElement(shadowRoot, '.ol-rotate-reset') as HTMLElement
    compassReset.setAttribute('aria-label', 'Reset map orientation to north')

    const zoomSliderThumb = queryElement(shadowRoot, '.ol-zoomslider-thumb') as HTMLElement
    zoomSliderThumb.setAttribute('aria-label', 'Adjust map zoom')

    const olZoomSlider = queryElement(shadowRoot, '.ol-zoomslider') as HTMLElement | null
    const olRotate = queryElement(shadowRoot, '.ol-rotate') as HTMLElement | null

    if (olZoomSlider && olRotate && olRotate.parentNode) {
      olRotate.parentNode.insertBefore(olZoomSlider, olRotate)
    }

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
