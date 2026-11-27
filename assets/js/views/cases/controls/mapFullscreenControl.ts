import Control from 'ol/control/Control'
import Map from 'ol/Map'
import initialiseMapFullscreen from './mapFullscreen'

export const mapFullscreenStyles = `
  :host .emdi-map-fullscreen-control {
    top: 8px;
    left: 0.5em;
    padding: 0;
    background: transparent;
  }

  :host .emdi-map-fullscreen-control .emdi-map-fullscreen-toggle {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 38px;
    height: 38px;
    margin: 0;
    padding: 0;
    border: 1px solid var(--govuk-border-colour, #cecece);
    background: var(--emdi-map-control-background, #ffffff);
    color: var(--govuk-text-colour, #0b0c0c);
    cursor: pointer;
  }

  :host .ol-zoom button {
    border-color: var(--govuk-border-colour, #cecece) !important;
  }


  .emdi-map-fullscreen-toggle__icon {
    display: block;
    width: 38px;
    height: 38px;
    fill: none;
    stroke: currentColor;
    stroke-width: 2;
    stroke-linecap: round;
    stroke-linejoin: round;
  }

  :host .ol-zoom {
    top: 54px;
  }
`

export default class MapFullscreenControl extends Control {
  private readonly button: HTMLButtonElement

  private readonly mapContainer: HTMLElement

  private cleanup?: () => void

  constructor(mapContainer: HTMLElement) {
    const element = document.createElement('div')
    element.className = 'ol-unselectable ol-control emdi-map-fullscreen-control'
    element.innerHTML = `
      <button class="emdi-map-fullscreen-toggle" id="emdi-map-fullscreen-toggle" type="button" aria-label="Full screen map" title="Full screen map">
        <svg class="emdi-map-fullscreen-toggle__icon" aria-hidden="true" focusable="false" viewBox="0 0 44 44">
          <path d="M10 16V10h6M28 10h6v6M34 28v6h-6M16 34h-6v-6"></path>
        </svg>
      </button>
    `

    super({ element })
    this.button = element.querySelector<HTMLButtonElement>('button')!
    this.mapContainer = mapContainer
  }

  setMap(map: Map | null) {
    this.cleanup?.()
    this.cleanup = undefined
    super.setMap(map)
    if (map) {
      this.element.parentElement?.prepend(this.element)
      this.cleanup = initialiseMapFullscreen(this.button, this.mapContainer, () => map.updateSize())
    }
  }

  protected disposeInternal() {
    this.cleanup?.()
    super.disposeInternal()
  }
}
