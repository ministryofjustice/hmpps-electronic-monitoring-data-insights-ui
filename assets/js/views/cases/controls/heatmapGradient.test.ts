import isHeatmapVisible from './heatmapGradient'
import { HeatmapLevel, heatmapLevelKeys } from './heatmapLevels'

const allOff: Record<HeatmapLevel, boolean> = { low: false, medium: false, high: false, veryHigh: false }

describe('isHeatmapVisible', () => {
  it.each(heatmapLevelKeys)('is visible when only %s is selected', level => {
    expect(isHeatmapVisible(true, { ...allOff, [level]: true })).toBe(true)
  })

  it('is hidden when every level is off', () => {
    expect(isHeatmapVisible(true, allOff)).toBe(false)
  })

  it('is hidden when heatmap is disabled', () => {
    expect(isHeatmapVisible(false, { ...allOff, high: true })).toBe(false)
  })
})
