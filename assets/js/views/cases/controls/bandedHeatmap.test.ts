import WebGLVectorLayerRenderer from 'ol/renderer/webgl/VectorLayer'
import BandedHeatmap, { heatmapBandShader } from './bandedHeatmap'
import { heatmapLevelKeys } from './heatmapLevels'

jest.mock('ol/renderer/webgl/VectorLayer', () => jest.fn())
jest.mock('ol/dom', () => ({
  ...jest.requireActual('ol/dom'),
  createCanvasContext2D: () => ({
    canvas: {},
    createLinearGradient: () => ({ addColorStop: jest.fn() }),
    fillRect: jest.fn(),
  }),
}))

describe('BandedHeatmap', () => {
  it.each(heatmapLevelKeys)('masks only %s without rebuilding or filtering the density source', level => {
    const layer = new BandedHeatmap({ radius: 10, blur: 15 })
    layer.createRenderer()
    const options = jest.mocked(WebGLVectorLayerRenderer).mock.calls.at(-1)![1]
    const uniforms = options.postProcesses![0].uniforms!
    const enabled = uniforms.u_enabled
    if (typeof enabled !== 'function') throw new Error('Expected dynamic band uniform')
    expect(enabled(undefined)).toEqual([1, 1, 1, 1])
    const levels = { low: true, medium: true, high: true, veryHigh: true, [level]: false }
    const changed = jest.spyOn(layer, 'changed')

    layer.setLevels(levels)

    expect(enabled(undefined)).toEqual(['low', 'medium', 'high', 'veryHigh'].map(key => Number(key !== level)))
    expect(changed).toHaveBeenCalledTimes(1)
    expect(jest.mocked(WebGLVectorLayerRenderer).mock.calls.filter(([candidate]) => candidate === layer)).toHaveLength(
      1,
    )
    levels[level] = true
    expect(enabled(undefined)).toContain(0)
    layer.setLevels({ low: true, medium: true, high: true, veryHigh: true })
    expect(enabled(undefined)).toEqual([1, 1, 1, 1])
  })

  it('uses masking in the alpha output as well as premultiplied RGB', () => {
    expect(heatmapBandShader).toContain('float alpha = density * u_opacity * enabled;')
    expect(heatmapBandShader).toContain('vec4(colour * alpha, alpha)')
  })
})
