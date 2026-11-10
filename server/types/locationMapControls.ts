export type MapBaseLayer = 'street' | 'satellite'
export type HeatmapLevel = 'veryHigh' | 'high' | 'medium' | 'low'

export const heatmapLevelKeys: HeatmapLevel[] = ['veryHigh', 'high', 'medium', 'low']

export interface LocationMapControls {
  baseLayer: MapBaseLayer
  tracks: boolean
  confidence: boolean
  numbers: boolean
  heatmap: boolean
  heatmapLevels: Record<HeatmapLevel, boolean>
  exclusion: boolean
}

export const defaultLocationMapControls: LocationMapControls = {
  baseLayer: 'street',
  tracks: true,
  confidence: true,
  numbers: true,
  heatmap: false,
  heatmapLevels: { veryHigh: true, high: true, medium: true, low: true },
  exclusion: false,
}
