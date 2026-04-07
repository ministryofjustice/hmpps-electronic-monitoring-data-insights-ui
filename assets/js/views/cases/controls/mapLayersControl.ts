import Control from 'ol/control/Control'
import VectorLayer from 'ol/layer/Vector'
import TileLayer from 'ol/layer/Tile'

interface MapLayersControlOptions {
  streetLayer?: TileLayer<any>
  satelliteLayer?: TileLayer<any>
  tracksLayer: VectorLayer<any>
  confidenceLayer: VectorLayer<any>
  numbersLayer: VectorLayer<any>
}

export default class MapLayersControl extends Control {
  constructor(opts: MapLayersControlOptions) {
    const el = document.createElement('div')
    el.className = 'ol-map-layers-control ol-unselectable ol-control'
    super({ element: el })
    this.renderControl(el, opts)
  }

  private renderControl(el: HTMLElement, opts: MapLayersControlOptions) {
    el.innerHTML = `
      <div class="mlc-panel">
        <div class="mlc-header">
          <span class="mlc-title">Layers</span>
          <button class="mlc-close" aria-label="Close layers panel">×</button>
        </div>
        <label><input type="radio" name="mlc-base" value="street" checked> Street</label>
        <label><input type="radio" name="mlc-base" value="satellite"> Satellite</label>
        <hr>
        <label><input type="checkbox" id="mlc-tracks" checked> Direction info</label>
        <label><input type="checkbox" id="mlc-confidence" checked> Confidence circles</label>
        <label><input type="checkbox" id="mlc-numbers"> Point numbers</label>
      </div>`

    el.querySelectorAll('[name="mlc-base"]').forEach(radio =>
      radio.addEventListener('change', (e) => {
        const val = (e.target as HTMLInputElement).value
        opts.streetLayer.setVisible(val === 'street')
        opts.satelliteLayer.setVisible(val === 'satellite')
      })
    )

    const bindCheckbox = (id: string, layer: VectorLayer<any>) =>
      el.querySelector(id)?.addEventListener('change', (e) =>
        layer.setVisible((e.target as HTMLInputElement).checked)
      )

    bindCheckbox('#mlc-tracks', opts.tracksLayer)
    bindCheckbox('#mlc-confidence', opts.confidenceLayer)
    bindCheckbox('#mlc-numbers', opts.numbersLayer)

    el.querySelector('.mlc-close')?.addEventListener('click', () => {
      el.style.display = 'none'
    })
  }
}