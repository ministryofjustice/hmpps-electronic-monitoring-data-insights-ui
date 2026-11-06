import { HeatmapLevel } from './heatmapLevels'

const isHeatmapVisible = (heatmapOn: boolean, levels: Record<HeatmapLevel, boolean>): boolean =>
  heatmapOn && Object.values(levels).some(Boolean)

export default isHeatmapVisible
