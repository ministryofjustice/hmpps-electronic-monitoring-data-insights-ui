import {
  LocationsLayer,
  TracksLayer,
  CirclesLayer,
  NumberingLayer,
} from '@ministryofjustice/hmpps-electronic-monitoring-components/map/layers'
import { isEmpty } from 'ol/extent'
import createLayerVisibilityToggle from './controls/layerVisibilityToggle'
import { queryElement } from '../../utils/utils'

const initialiseLocationDataView = async () => {
  try {
    const emMap = queryElement(document, 'em-map')

    if (!emMap) {
      // eslint-disable-next-line no-console
      console.warn('em-map element not found in DOM')
      return
    }

    await Promise.race([
      new Promise(resolve => {
        emMap.addEventListener(
          'map:ready',
          () => {
            resolve()
          },
          { once: true },
        )
      }),
      new Promise((_, reject) => {
        setTimeout(() => {
          reject(new Error('Map took too long to load'))
        }, 5000)
      }),
    ])

    const map = emMap.olMapInstance
    const { positions } = emMap

    const locationsLayer = emMap.addLayer(
      new LocationsLayer({
        title: 'pointsLayer',
        positions,
      }),
    )

    const tracksLayer = emMap.addLayer(
      new TracksLayer({
        title: 'tracksLayer',
        positions,
        visible: true,
      }),
    )

    const confidenceLayer = emMap.addLayer(
      new CirclesLayer({
        positions,
        id: 'confidence',
        title: 'confidenceLayer',
        visible: false,
        zIndex: 20,
      }),
    )

    const numbersLayer = emMap.addLayer(
      new NumberingLayer({
        positions,
        numberProperty: 'sequenceNumber',
        title: 'numberingLayer',
        visible: false,
        zIndex: 30,
      }),
    )

    emMap.dispatchEvent(
      new CustomEvent('app:map:layers:ready', {
        bubbles: true,
        composed: true,
        detail: { message: 'All custom layers added' },
      }),
    )

    const locationSource = locationsLayer ? locationsLayer.getSource() : null

    if (locationSource) {
      const extent = locationSource.getExtent()
      if (isEmpty(extent) === false) {
        map.getView().fit(extent, {
          maxZoom: 16,
          padding: [30, 30, 30, 30],
          size: map.getSize(),
        })
      }
    }

    // Add controls
    if (locationsLayer) createLayerVisibilityToggle('#locations', locationsLayer, emMap)
    if (tracksLayer) createLayerVisibilityToggle('#tracks', tracksLayer, emMap)
    if (confidenceLayer) createLayerVisibilityToggle('#confidence', confidenceLayer)
    if (numbersLayer) createLayerVisibilityToggle('#numbering', numbersLayer)
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error initializing location data view:', error.message)
  }
}

export default initialiseLocationDataView
