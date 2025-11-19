import LayerGroup from 'ol/layer/Group'
import Layer from 'ol/layer/Layer'
import { EmMap } from '@ministryofjustice/hmpps-electronic-monitoring-components/map'

const toggleVisibility = (layer: Layer | LayerGroup, emMap?: EmMap) => () => {
  const visible = layer.getVisible()

  if (visible && emMap) {
    emMap.closeOverlay()
  }

  layer.setVisible(!visible)
}

const createLayerVisibilityToggle = (selector: string, layer: Layer | LayerGroup, emMap?: EmMap) => {
  const element = document.querySelector(selector) as HTMLElement

  if (element !== null) {
    element.onchange = toggleVisibility(layer, emMap)
  }
}

export default createLayerVisibilityToggle
