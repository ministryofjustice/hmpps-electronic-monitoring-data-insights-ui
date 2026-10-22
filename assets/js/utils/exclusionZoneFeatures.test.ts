import { buildExclusionZoneFeatures } from './exclusionZoneFeatures'

describe('buildExclusionZoneFeatures', () => {
  it('renders a polygon zone', () => {
    const features = buildExclusionZoneFeatures([
      {
        name: 'A',
        geometry: {
          type: 'Polygon',
          coordinates: [
            [
              [-0.1, 51.5],
              [-0.1, 51.51],
              [-0.09, 51.51],
              [-0.1, 51.5],
            ],
          ],
        },
      },
    ])
    expect(features).toHaveLength(1)
    expect(features[0].getGeometry()!.getType()).toBe('Polygon')
  })

  it('renders a point with a radius as a circle around the point', () => {
    const features = buildExclusionZoneFeatures([
      { name: 'B', radius: 100, geometry: { type: 'Point', coordinates: [-0.1367, 51.5108] } },
    ])
    expect(features).toHaveLength(1)
    expect(features[0].getGeometry()!.getType()).toBe('Polygon')
  })

  it('skips a point with no radius and unknown geometry types', () => {
    const features = buildExclusionZoneFeatures([
      { name: 'C', geometry: { type: 'Point', coordinates: [-0.1, 51.5] } },
      { name: 'D', geometry: { type: 'LineString', coordinates: [] } },
    ])
    expect(features).toHaveLength(0)
  })
})
