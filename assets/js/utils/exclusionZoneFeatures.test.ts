import Polygon from 'ol/geom/Polygon'
import { fromLonLat, toLonLat } from 'ol/proj'
import { getDistance } from 'ol/sphere'
import { buildExclusionZoneFeatures } from './exclusionZoneFeatures'

describe('buildExclusionZoneFeatures', () => {
  it('Interpret coordinates according to polygon geometry type', () => {
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
    const geometry = features[0].getGeometry()
    expect(geometry).toBeInstanceOf(Polygon)
    if (!(geometry instanceof Polygon)) throw new Error('Expected a polygon boundary')

    const expectedBoundary = [
      [-0.1, 51.5],
      [-0.1, 51.51],
      [-0.09, 51.51],
      [-0.1, 51.5],
    ].map(coordinate => fromLonLat(coordinate))
    expect(geometry.getCoordinates()).toEqual([expectedBoundary])
  })

  it.each([
    { radiusProperty: 'geometry.radiusMetres', radius: 100, centre: [-0.1, 51.5] },
    { radiusProperty: 'radius', radius: 250, centre: [-0.1367, 51.5108] },
  ])('renders a circle centred on the point using $radiusProperty', ({ radiusProperty, radius, centre }) => {
    const features = buildExclusionZoneFeatures([
      {
        name: 'B',
        ...(radiusProperty === 'radius' ? { radius } : {}),
        geometry: {
          type: 'Point',
          coordinates: centre,
          ...(radiusProperty === 'geometry.radiusMetres' ? { radiusMetres: radius } : {}),
        },
      },
    ])
    expect(features).toHaveLength(1)
    const geometry = features[0].getGeometry()
    expect(geometry).toBeInstanceOf(Polygon)
    if (!(geometry instanceof Polygon)) throw new Error('Expected a circular polygon')

    const boundary = geometry.getCoordinates()[0]
    expect(boundary).toHaveLength(65)
    expect(boundary[boundary.length - 1]).toEqual(boundary[0])
    boundary.forEach(coordinate => {
      expect(getDistance(centre, toLonLat(coordinate))).toBeCloseTo(radius, 3)
    })
  })

  it('skips a point with no radius and unknown geometry types', () => {
    const features = buildExclusionZoneFeatures([
      { name: 'C', geometry: { type: 'Point', coordinates: [-0.1, 51.5] } },
      { name: 'D', geometry: { type: 'LineString', coordinates: [] } },
    ])
    expect(features).toHaveLength(0)
  })
})
