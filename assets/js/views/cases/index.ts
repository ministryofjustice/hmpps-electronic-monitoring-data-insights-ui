import { EmMap } from '@ministryofjustice/hmpps-electronic-monitoring-components/map'
import {
  LocationsLayer,
  TracksLayer,
  CirclesLayer,
  TextLayer,
} from '@ministryofjustice/hmpps-electronic-monitoring-components/map/layers'
import { isEmpty } from 'ol/extent'
import createLayerVisibilityToggle from './controls/layerVisibilityToggle'
import { queryElement } from '../../utils/utils'
import { initialiseClearFilters } from './controls/initialiseClearFilters'
// import { initialiseDatePickerConstraints } from './controls/initialiseDatePickerConstraints'
                                                                                                                           
const initialiseLocationDataView = async () => {
  const emMap = queryElement(document, 'em-map') as EmMap

  await new Promise<void>(resolve => {
    emMap.addEventListener('map:ready', () => resolve(), { once: true })
  })

  const map = emMap.olMapInstance!
  const { positions } = emMap
  const locationsLayer = emMap.addLayer(
    new LocationsLayer({
      title: 'pointsLayer',
      positions,
      zIndex: 4,
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
  
  initialiseClearFilters()
  // initialiseDatePickerConstraints()

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
      console.log('Fitting map to extent:', extent)                                                           
      map.getView().fit(extent, {
        maxZoom: 20,
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
}

export default initialiseLocationDataView
