import { buildGradient, isHeatmapVisible, levelsLowToHigh, STOPS_PER_LEVEL, toTransparent } from './heatmapGradient'
import { HeatmapLevel, heatmapLevelColours } from './heatmapLevels'

const allOn: Record<HeatmapLevel, boolean> = { veryHigh: true, high: true, medium: true, low: true }
const allOff: Record<HeatmapLevel, boolean> = { veryHigh: false, high: false, medium: false, low: false }

const bandFor = (gradient: string[], level: HeatmapLevel) => {
  const start = levelsLowToHigh.indexOf(level) * STOPS_PER_LEVEL
  return gradient.slice(start, start + STOPS_PER_LEVEL)
}

describe('toTransparent', () => {
  it('keeps the rgb of a hex colour and sets alpha to 0', () => {
    expect(toTransparent('#fde725')).toBe('rgba(253,231,37,0)')
    expect(toTransparent('#440154')).toBe('rgba(68,1,84,0)')
  })

  it('falls back to transparent black for non 6-digit hex values', () => {
    expect(toTransparent('red')).toBe('rgba(0,0,0,0)')
    expect(toTransparent('#fff')).toBe('rgba(0,0,0,0)')
  })
})

describe('buildGradient', () => {
  it('has the same number of stops per level', () => {
    expect(buildGradient(allOn)).toHaveLength(levelsLowToHigh.length * STOPS_PER_LEVEL)
  })

  it('uses each level colour for every stop when all levels are on', () => {
    const gradient = buildGradient(allOn)
    levelsLowToHigh.forEach((level: HeatmapLevel) => {
      expect(bandFor(gradient, level).every(stop => stop === heatmapLevelColours[level])).toBe(true)
    })
  })

  it.each(levelsLowToHigh)('makes only the %s band transparent when that level is off', (offLevel: HeatmapLevel) => {
    const gradient = buildGradient({ ...allOn, [offLevel]: false })

    levelsLowToHigh.forEach((level: HeatmapLevel) => {
      const expected = level === offLevel ? toTransparent(heatmapLevelColours[level]) : heatmapLevelColours[level]
      expect(bandFor(gradient, level).every(stop => stop === expected)).toBe(true)
    })
  })

  it.each(levelsLowToHigh)('shows only the %s band when only that level is on', (onLevel: HeatmapLevel) => {
    const gradient = buildGradient({ ...allOff, [onLevel]: true })

    levelsLowToHigh.forEach((level: HeatmapLevel) => {
      const expected = level === onLevel ? heatmapLevelColours[level] : toTransparent(heatmapLevelColours[level])
      expect(bandFor(gradient, level).every(stop => stop === expected)).toBe(true)
    })
  })

  it('has no visible stops when every level is off', () => {
    const gradient = buildGradient(allOff)
    expect(gradient.every((stop: string) => /,0\)$/.test(stop))).toBe(true)
  })

  it('never uses transparent black when the colours are hex values', () => {
    expect(buildGradient(allOff).some((stop: string) => stop === 'rgba(0,0,0,0)')).toBe(false)
  })

  it('restores the colours when levels are turned back on', () => {
    expect(buildGradient(allOn)).toEqual(buildGradient({ ...allOff, ...allOn }))
  })
})

describe('isHeatmapVisible', () => {
  it('is visible when the heatmap is on and at least one level is on', () => {
    expect(isHeatmapVisible(true, { ...allOff, low: true })).toBe(true)
    expect(isHeatmapVisible(true, allOn)).toBe(true)
  })

  it('is hidden when every level is off', () => {
    expect(isHeatmapVisible(true, allOff)).toBe(false)
  })

  it('is hidden when the parent heatmap checkbox is off, whatever the levels', () => {
    expect(isHeatmapVisible(false, allOn)).toBe(false)
  })
})
