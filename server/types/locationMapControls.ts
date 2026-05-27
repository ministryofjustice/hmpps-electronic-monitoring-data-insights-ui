export type MapBaseLayer = 'street' | 'satellite'

export interface LocationMapControls {
  baseLayer: MapBaseLayer
  tracks: boolean
  confidence: boolean
  numbers: boolean
}

export const defaultLocationMapControls: LocationMapControls = {
  baseLayer: 'street',
  tracks: true,
  confidence: true,
  numbers: true,
}
