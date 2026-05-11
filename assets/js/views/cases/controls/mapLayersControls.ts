import Control from 'ol/control/Control'
import TileLayer from 'ol/layer/Tile'
import TileSource from 'ol/source/Tile'
import type BaseLayer from 'ol/layer/Base'
import { ComposableLayer } from '@ministryofjustice/hmpps-electronic-monitoring-components/map/layers'
import { EmMap } from '@ministryofjustice/hmpps-electronic-monitoring-components/map'

interface MapLayersControlOptions {
  streetLayer?: TileLayer<TileSource>
  satelliteLayer?: TileLayer<TileSource>
  tracksLayer: ComposableLayer
  confidenceLayer?: ComposableLayer
  numbersLayer?: ComposableLayer
  mapContainer: HTMLElement
  map: EmMap
}

export default class MapLayersControl extends Control {
  private panel: HTMLElement

  private openBtn: HTMLElement

  constructor(opts: MapLayersControlOptions) {
    const el = document.createElement('div')
    super({ element: el })

    const { mapContainer } = opts
    mapContainer.style.position = 'relative'

    const { panel, openBtn } = MapLayersControl.createPanel(opts)
    this.panel = panel
    this.openBtn = openBtn

    mapContainer.appendChild(this.panel)
    mapContainer.appendChild(this.openBtn)
  }

  private static createPanel(opts: MapLayersControlOptions): { panel: HTMLElement; openBtn: HTMLElement } {
    const openBtn = document.createElement('button')
    openBtn.setAttribute('aria-label', 'Open layers panel')
    openBtn.className = 'govuk-button govuk-button--secondary mlc-open-btn'
    openBtn.innerHTML = 'Open control panel &#9656;'
    openBtn.setAttribute('data-hidden', 'true')

    const panel = document.createElement('div')
    panel.className = 'mlc-panel'

    const toggle = (hide: HTMLElement, show: HTMLElement) => {
      hide.setAttribute('data-hidden', 'true')
      show.removeAttribute('data-hidden')
    }

    panel.innerHTML = `
      <div class="govuk-form-group govuk-!-margin-bottom-0">
        <div class="mlc-header govuk-!-margin-bottom-1">
          <button 
            type="button" 
            class="mlc-panel__close" 
            aria-label="Close control panel"
          >
            Close control panel
            <span aria-hidden="true">&#9662;</span>
          </button>
        </div>

        <fieldset class="govuk-fieldset">
            <div class="govuk-radios govuk-radios--small" data-module="govuk-radios">
                <div class="govuk-radios__item">
                  <input class="govuk-radios__input" id="mlc-base-street" name="mlc-base" type="radio" value="street" checked>
                  <label class="govuk-label govuk-radios__label" for="mlc-base-street">Street</label>
                </div>
                <div class="govuk-radios__item">
                  <input class="govuk-radios__input" id="mlc-base-satellite" name="mlc-base" type="radio" value="satellite">
                  <label class="govuk-label govuk-radios__label" for="mlc-base-satellite">Satellite</label>
                </div>
            </div>
        </fieldset>
     </div>

      <hr class="govuk-section-break govuk-section-break--visible mlc-panel__divider">

      <div class="govuk-form-group govuk-!-margin-bottom-0">
        <fieldset class="govuk-fieldset">
          <div class="govuk-checkboxes govuk-checkboxes--small" data-module="govuk-checkboxes">
            <div class="govuk-checkboxes__item">
              <input class="govuk-checkboxes__input" id="mlc-tracks" type="checkbox" ${(opts.map.getNativeLayer(opts.tracksLayer.id) as BaseLayer)?.getVisible() ? 'checked' : ''}>
              <label class="govuk-label govuk-checkboxes__label" for="mlc-tracks">Direction info</label>
            </div>
            <div class="govuk-checkboxes__item">
              <input class="govuk-checkboxes__input" id="mlc-confidence" type="checkbox" ${(opts.map.getNativeLayer(opts.confidenceLayer?.id) as BaseLayer | undefined)?.getVisible() ? 'checked' : ''}>
              <label class="govuk-label govuk-checkboxes__label" for="mlc-confidence">Confidence circles</label>
            </div>
            <div class="govuk-checkboxes__item">
              <input class="govuk-checkboxes__input" id="mlc-numbers" type="checkbox" ${(opts.map.getNativeLayer(opts.numbersLayer?.id) as BaseLayer | undefined)?.getVisible() ? 'checked' : ''}>
              <label class="govuk-label govuk-checkboxes__label" for="mlc-numbers">Point numbers</label>
            </div>
          </div>
        </fieldset>
      </div>`

    panel.querySelectorAll('[name="mlc-base"]').forEach(radio =>
      radio.addEventListener('change', e => {
        const val = (e.target as HTMLInputElement).value
        opts.streetLayer?.setVisible(val === 'street')
        opts.satelliteLayer?.setVisible(val === 'satellite')
      }),
    )

    const bindCheckbox = (id: string, layer?: ComposableLayer) => {
      const input = panel.querySelector(id) as HTMLInputElement | null
      if (!input || !layer) return
      const nativeLayer = opts.map.getNativeLayer(layer.id)
      input.addEventListener('change', () => nativeLayer?.setVisible(input.checked))
    }

    bindCheckbox('#mlc-tracks', opts.tracksLayer)
    bindCheckbox('#mlc-confidence', opts.confidenceLayer)
    bindCheckbox('#mlc-numbers', opts.numbersLayer)

    panel.querySelector('.mlc-panel__close')?.addEventListener('click', () => toggle(panel, openBtn))

    openBtn.addEventListener('click', () => toggle(openBtn, panel))

    return { panel, openBtn }
  }

  override disposeInternal() {
    this.panel.remove()
    this.openBtn.remove()
    super.disposeInternal()
  }
}
