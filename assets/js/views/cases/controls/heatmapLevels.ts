export type HeatmapLevel = 'veryHigh' | 'high' | 'medium' | 'low'

export const heatmapLevelLabels: Record<HeatmapLevel, string> = {
  veryHigh: 'Very high activity',
  high: 'High activity',
  medium: 'Medium activity',
  low: 'Low activity',
}

export const heatmapLevelColours: Record<HeatmapLevel, string> = {
  veryHigh: '#fde725',
  high: '#5ec962',
  medium: '#3b528b',
  low: '#440154',
}

export const heatmapLevelKeys = Object.keys(heatmapLevelLabels) as HeatmapLevel[]
