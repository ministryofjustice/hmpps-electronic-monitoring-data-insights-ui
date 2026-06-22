import { EmMap, Position } from '@ministryofjustice/hmpps-electronic-monitoring-components/map'
import {
  LocationsLayer,
  TracksLayer,
  CirclesLayer,
  TextLayer,
} from '@ministryofjustice/hmpps-electronic-monitoring-components/map/layers'
import { isEmpty } from 'ol/extent'
import VectorLayer from 'ol/layer/Vector'
import { Point } from 'ol/geom'
import { Interaction } from 'ol/interaction'
import { queryElement } from '../../utils/utils'
import createLockRotationControl from './controls/createLockRotationControl'
import getRotatedDirection from './controls/getRotatedDirection'
import MapLayersControl, { MapControlState } from './controls/mapLayersControls'

interface ShadowRootHost extends HTMLElement {
  shadowRoot: ShadowRoot | null
}

export interface TrackPosition extends Position {
  gpsDate?: string
  displayPointNumber?: number
}

export type OverlayInteraction = Interaction & {
  overlay?: {
    showAtCoordinate?: (coords: number[], properties?: Record<string, unknown>) => void
  }
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

    let currentPointIndex: number | null = null

    const openOverlayForIndex = (index: number) => {
      const position = positions[index] as TrackPosition
      currentPointIndex = index

      const nativeLayers = locationsLayer.getNativeLayer()
      const vectorLayer = Array.isArray(nativeLayers) ? (nativeLayers[0] as VectorLayer) : null
      const source = vectorLayer?.getSource?.()
      if (!source) return

      const feature = source
        .getFeatures()
        .find(f => f.getProperties().displayPointNumber === position.displayPointNumber)
      if (!feature) return

      const geometry = feature.getGeometry()
      if (!(geometry instanceof Point)) return
      const coords = geometry.getCoordinates()

      map.getView().animate({ center: coords, duration: 300 })

      const interactions = map.getInteractions().getArray()
      const clickInteraction = interactions.find((i: OverlayInteraction) => i.overlay?.showAtCoordinate)
      if (clickInteraction) {
        ;(clickInteraction as OverlayInteraction).overlay.showAtCoordinate(coords, feature.getProperties())
      }
    }

    const shadowRootMap = getShadowRoot(emMap as EmMap)

    shadowRootMap?.addEventListener('click', (e: Event) => {
      const target = e.target as HTMLElement
      const navLink = target.closest('[data-nav]') as HTMLElement | null
      if (!navLink) return
      e.preventDefault()

      const direction = navLink.dataset.nav
      if (currentPointIndex === null) return

      if (direction === 'prev' && currentPointIndex > 0) {
        openOverlayForIndex(currentPointIndex - 1)
      } else if (direction === 'next' && currentPointIndex < positions.length - 1) {
        openOverlayForIndex(currentPointIndex + 1)
      } else if (direction === 'first') {
        openOverlayForIndex(0)
      } else if (direction === 'last') {
        openOverlayForIndex(positions.length - 1)
      }
    })

    const interactions = map.getInteractions().getArray()
    const clickInteraction = interactions.find(
      (i): i is OverlayInteraction => !!(i as OverlayInteraction).overlay?.showAtCoordinate,
    )

    if (clickInteraction) {
      const originalShowAtCoordinate = clickInteraction.overlay!.showAtCoordinate!.bind(clickInteraction.overlay)
      clickInteraction.overlay!.showAtCoordinate = (coords, properties) => {
        const pointNumber = properties?.displayPointNumber
        const index = positions.findIndex(p => (p as TrackPosition).displayPointNumber === pointNumber)
        if (index !== -1) currentPointIndex = index
        originalShowAtCoordinate(coords, properties)
      }
    }

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
