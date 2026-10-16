import { HeatmapLevel, heatmapLevelColours } from './heatmapLevels'

export const levelsLowToHigh: HeatmapLevel[] = ['low', 'medium', 'high', 'veryHigh']
export const STOPS_PER_LEVEL = 16

export const toTransparent = (colour: string): string => {
  const hex = colour.replace('#', '')
  if (!/^[0-9a-f]{6}$/i.test(hex)) return 'rgba(0,0,0,0)'
  const [r, g, b] = [0, 2, 4].map(i => parseInt(hex.slice(i, i + 2), 16))
  return `rgba(${r},${g},${b},0)`
}

export const buildGradient = (levels: Record<HeatmapLevel, boolean>): string[] =>
  levelsLowToHigh.flatMap(level => {
    const colour = heatmapLevelColours[level]
    return Array(STOPS_PER_LEVEL).fill(levels[level] ? colour : toTransparent(colour))
  })

export const isHeatmapVisible = (heatmapOn: boolean, levels: Record<HeatmapLevel, boolean>): boolean =>
  heatmapOn && Object.values(levels).some(Boolean)
