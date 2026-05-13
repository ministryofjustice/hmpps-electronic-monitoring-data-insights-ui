import { EmMap } from '@ministryofjustice/hmpps-electronic-monitoring-components/map'
import {
  LocationsLayer,
  TracksLayer,
  CirclesLayer,
  TextLayer,
} from '@ministryofjustice/hmpps-electronic-monitoring-components/map/layers'
import { isEmpty } from 'ol/extent'
import type VectorLayer from 'ol/layer/Vector'
import MapLayersControl from './controls/mapLayersControls'
import getRotatedDirection from './controls/getRotatedDirection'
import createLockRotationControl from './controls/createLockRotationControl'
import { queryElement } from '../../utils/utils'

interface ShadowRootHost extends HTMLElement {
  shadowRoot: ShadowRoot | null
}

const getShadowRoot = (emMap: EmMap): ShadowRoot | null => (emMap as ShadowRootHost).shadowRoot

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
