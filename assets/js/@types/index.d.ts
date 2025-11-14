import { Map } from 'ol'

declare global {
  interface Element {
    map?: Map
  }

  interface Window {
    Cypress?: unknown
  }
}
