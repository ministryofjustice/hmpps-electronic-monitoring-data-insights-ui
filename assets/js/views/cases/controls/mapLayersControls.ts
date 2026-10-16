import Control from 'ol/control/Control'
import TileLayer from 'ol/layer/Tile'
import TileSource from 'ol/source/Tile'
import type BaseLayer from 'ol/layer/Base'
import { ComposableLayer } from '@ministryofjustice/hmpps-electronic-monitoring-components/map/layers'
import { EmMap } from '@ministryofjustice/hmpps-electronic-monitoring-components/map'
import { HeatmapLevel, heatmapLevelKeys, heatmapLevelLabels, heatmapLevelColours } from './heatmapLevels'

export type { HeatmapLevel }

export interface MapControlState {
  baseLayer: 'street' | 'satellite'
  tracks: boolean
  confidence: boolean
  numbers: boolean
  heatmap: boolean
  heatmapLevels: Record<HeatmapLevel, boolean>
  exclusion: boolean
}

export type MapControlInitialState = Partial<Omit<MapControlState, 'heatmapLevels'>> & {
  heatmapLevels?: Partial<Record<HeatmapLevel, boolean>>
}

interface MapLayersControlOptions {
  streetLayer?: TileLayer<TileSource>
  satelliteLayer?: TileLayer<TileSource>
  tracksLayer: ComposableLayer
  confidenceLayer?: ComposableLayer
  numbersLayer?: ComposableLayer
  heatmapLayer?: ComposableLayer
  exclusionLayer?: BaseLayer
  enableHeatmap?: boolean
  enableExclusionZones?: boolean
  mapContainer: HTMLElement
  map: EmMap
  initialState?: MapControlInitialState
  onChange?: (state: MapControlState) => void
  onHeatmapLevelsChange?: (levels: Record<HeatmapLevel, boolean>) => void
}

const defaultMapControlState: MapControlState = {
  baseLayer: 'street',
  tracks: true,
  confidence: true,
  numbers: true,
  heatmap: true,
  heatmapLevels: {
    veryHigh: true,
    high: true,
    medium: true,
    low: true,
  },
  exclusion: false,
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
    const state: MapControlState = {
      ...defaultMapControlState,
      ...opts.initialState,
      heatmapLevels: {
        ...defaultMapControlState.heatmapLevels,
        ...opts.initialState?.heatmapLevels,
      },
    }

    const openBtn = document.createElement('button')
    openBtn.setAttribute('aria-label', 'Open map controls')
    openBtn.setAttribute('aria-controls', 'map-controls-panel')
    openBtn.setAttribute('aria-expanded', 'true')
    openBtn.className = 'govuk-button mlc-open-btn govuk-button--inverse'
    openBtn.innerHTML = 'Open map controls &#9656;'
    openBtn.setAttribute('data-hidden', 'true')

    const panel = document.createElement('div')
    panel.id = 'map-controls-panel'
    panel.className = 'mlc-panel'
    panel.setAttribute('role', 'region')
    panel.setAttribute('aria-label', 'Map controls')

    const heatmapLevelItems = heatmapLevelKeys
      .map(
        level => `
              <div class="govuk-checkboxes__item">
                <input class="govuk-checkboxes__input" id="mlc-heatmap-${level}" type="checkbox"
                  data-heatmap-level="${level}" ${state.heatmapLevels[level] ? 'checked' : ''} ${state.heatmap ? '' : 'disabled'}>
                <label class="govuk-label govuk-checkboxes__label" for="mlc-heatmap-${level}">
                  <span class="mlc-swatch" data-swatch-level="${level}" aria-hidden="true"></span>
                  ${heatmapLevelLabels[level]}
                </label>
              </div>`,
      )
      .join('')

    const heatmapExpanded = state.heatmap

    panel.innerHTML = `
      <div class="govuk-form-group govuk-!-margin-bottom-0">
        <div class="mlc-header govuk-!-margin-bottom-1">
          <button 
            type="button" 
            class="mlc-panel__close govuk-button govuk-button--secondary" 
            aria-label="Close map controls"
            aria-controls="map-controls-panel"
            aria-expanded="true"
          >
            Close map controls
            <span aria-hidden="true">&#9662;</span>
          </button>
        </div>
        
        <fieldset class="govuk-fieldset">
            <span class="govuk-fieldset__heading govuk-!-font-weight-bold">Map View</span>
            <div class="govuk-radios govuk-radios--small" data-module="govuk-radios">
                <div class="govuk-radios__item">
                  <input class="govuk-radios__input" id="mlc-base-street" name="mlc-base" type="radio" value="street" ${state.baseLayer === 'street' ? 'checked' : ''}>
                  <label class="govuk-label govuk-radios__label" for="mlc-base-street">Street</label>
                </div>
            </div>
        </fieldset>
     </div>

      <hr class="govuk-section-break govuk-section-break--visible mlc-panel__divider" aria-hidden="true">
      <div class="govuk-form-group govuk-!-margin-bottom-0">
        <fieldset class="govuk-fieldset">
            <span class="govuk-fieldset__heading govuk-!-font-weight-bold">Map Controls</span>
          <div class="govuk-checkboxes govuk-checkboxes--small" data-module="govuk-checkboxes">
            <div class="govuk-checkboxes__item">
              <input class="govuk-checkboxes__input" id="mlc-tracks" type="checkbox" ${state.tracks ? 'checked' : ''}>
              <label class="govuk-label govuk-checkboxes__label" for="mlc-tracks">Direction of travel</label>
            </div>
            <div class="govuk-checkboxes__item">
              <input class="govuk-checkboxes__input" id="mlc-confidence" type="checkbox" ${state.confidence ? 'checked' : ''}>
              <label class="govuk-label govuk-checkboxes__label" for="mlc-confidence">View location accuracy</label>
            </div>
            <div class="govuk-checkboxes__item">
              <input class="govuk-checkboxes__input" id="mlc-numbers" type="checkbox" ${state.numbers ? 'checked' : ''}>
              <label class="govuk-label govuk-checkboxes__label" for="mlc-numbers">Point numbers</label>
            </div>
          </div>
        </fieldset>
      </div>
      ${
        opts.enableHeatmap
          ? `
      <hr class="govuk-section-break govuk-section-break--visible mlc-panel__divider" aria-hidden="true">
      <div class="govuk-form-group govuk-!-margin-bottom-0 mlc-heatmap">
        <button type="button" class="mlc-collapsible-trigger" aria-controls="mlc-heatmap-content"
          aria-expanded="${heatmapExpanded}">
          <span class="mlc-collapsible-icon" aria-hidden="true"></span>
          <span class="mlc-collapsible-title">Heatmap</span>
        </button>
        <div class="mlc-collapsible-content" id="mlc-heatmap-content" ${heatmapExpanded ? '' : 'hidden'}>
          <div class="govuk-checkboxes govuk-checkboxes--small">
            <div class="govuk-checkboxes__item">
              <input class="govuk-checkboxes__input" id="mlc-heatmap" type="checkbox" ${state.heatmap ? 'checked' : ''}>
              <label class="govuk-label govuk-checkboxes__label" for="mlc-heatmap">Heatmap</label>
            </div>
            ${heatmapLevelItems}
          </div>
        </div>
      </div>`
          : ``
      }
      ${
        opts.enableExclusionZones
          ? `  
      <hr class="govuk-section-break govuk-section-break--visible mlc-panel__divider" aria-hidden="true">
      <div class="govuk-form-group govuk-!-margin-bottom-0">
        <fieldset class="govuk-fieldset">
            <span class="govuk-fieldset__heading govuk-!-font-weight-bold">Zones</span>
          <div class="govuk-checkboxes govuk-checkboxes--small" data-module="govuk-checkboxes">
            <div class="govuk-checkboxes__item">
              <input class="govuk-checkboxes__input" id="mlc-exclusion" type="checkbox" ${state.exclusion ? 'checked' : ''}>
              <label class="govuk-label govuk-checkboxes__label" for="mlc-exclusion">Exclusion</label>
            </div>
          </div>
        </fieldset>
      </div>`
          : ``
      }`

    panel.querySelectorAll<HTMLElement>('[data-swatch-level]').forEach(swatch => {
      // eslint-disable-next-line no-param-reassign
      swatch.style.backgroundColor = heatmapLevelColours[swatch.dataset.swatchLevel as HeatmapLevel]
    })

    const closeBtn = panel.querySelector('.mlc-panel__close') as HTMLButtonElement
    const setExpanded = (expanded: boolean) => {
      panel.toggleAttribute('data-hidden', !expanded)
      openBtn.toggleAttribute('data-hidden', expanded)
      openBtn.setAttribute('aria-expanded', String(expanded))
      closeBtn.setAttribute('aria-expanded', String(expanded))
    }

    const notifyChange = () => opts.onChange?.({ ...state, heatmapLevels: { ...state.heatmapLevels } })

    opts.streetLayer?.setVisible(state.baseLayer === 'street')
    opts.satelliteLayer?.setVisible(state.baseLayer === 'satellite')

    panel.querySelectorAll('[name="mlc-base"]').forEach(radio =>
      radio.addEventListener('change', e => {
        const val = (e.target as HTMLInputElement).value
        state.baseLayer = val === 'satellite' ? 'satellite' : 'street'
        opts.streetLayer?.setVisible(val === 'street')
        opts.satelliteLayer?.setVisible(val === 'satellite')
        notifyChange()
      }),
    )

    const bindCheckbox = (
      id: string,
      stateKey: 'tracks' | 'confidence' | 'numbers' | 'heatmap' | 'exclusion',
      layer?: ComposableLayer,
    ) => {
      const input = panel.querySelector(id) as HTMLInputElement | null
      if (!input || !layer) return

      const raw = layer.getNativeLayer()
      const nativeLayers: BaseLayer[] = (() => {
        if (Array.isArray(raw)) return raw
        if (raw) return [raw]
        return []
      })()

      nativeLayers.forEach(l => l.setVisible(state[stateKey]))
      input.addEventListener('change', () => {
        state[stateKey] = input.checked
        nativeLayers.forEach(l => l.setVisible(input.checked))
        notifyChange()
      })
    }

    const bindNativeLayerCheckbox = (id: string, stateKey: 'exclusion', layer?: BaseLayer) => {
      const input = panel.querySelector(id) as HTMLInputElement | null
      if (!input) return
      if (!layer) {
        return
      }
      layer.setVisible(state[stateKey])
      input.addEventListener('change', () => {
        state[stateKey] = input.checked
        layer.setVisible(input.checked)
        notifyChange()
      })
    }

    bindCheckbox('#mlc-tracks', 'tracks', opts.tracksLayer)
    bindCheckbox('#mlc-confidence', 'confidence', opts.confidenceLayer)
    bindCheckbox('#mlc-numbers', 'numbers', opts.numbersLayer)
    bindCheckbox('#mlc-heatmap', 'heatmap', opts.heatmapLayer)
    bindNativeLayerCheckbox('#mlc-exclusion', 'exclusion', opts.exclusionLayer)

    const heatmapParent = panel.querySelector<HTMLInputElement>('#mlc-heatmap')
    const levelInputs = panel.querySelectorAll<HTMLInputElement>('[data-heatmap-level]')

    heatmapParent?.addEventListener('change', () => {
      levelInputs.forEach(input => {
        // eslint-disable-next-line no-param-reassign
        input.disabled = !heatmapParent.checked
      })
    })

    levelInputs.forEach(input =>
      input.addEventListener('change', () => {
        const level = input.dataset.heatmapLevel as HeatmapLevel
        state.heatmapLevels[level] = input.checked
        opts.onHeatmapLevelsChange?.({ ...state.heatmapLevels })
        notifyChange()
      }),
    )

    const heatmapTrigger = panel.querySelector<HTMLButtonElement>('.mlc-collapsible-trigger')
    const heatmapContent = panel.querySelector<HTMLElement>('#mlc-heatmap-content')

    heatmapTrigger?.addEventListener('click', () => {
      const isExpanded = heatmapTrigger.getAttribute('aria-expanded') === 'true'
      heatmapTrigger.setAttribute('aria-expanded', String(!isExpanded))
      heatmapContent?.toggleAttribute('hidden', isExpanded)
    })

    if (opts.enableHeatmap) {
      opts.onHeatmapLevelsChange?.({ ...state.heatmapLevels })
    }

    closeBtn.addEventListener('click', () => {
      setExpanded(false)
      openBtn.focus()
    })

    openBtn.addEventListener('click', () => {
      setExpanded(true)
      const firstFocusable = panel.querySelector<HTMLElement>(
        'input, button, [href], select, textarea, [tabindex]:not([tabindex="-1"])',
      )
      firstFocusable?.focus()
    })

    return { panel, openBtn }
  }

  override disposeInternal() {
    this.panel.remove()
    this.openBtn.remove()
    super.disposeInternal()
  }
}
