import Feature from 'ol/Feature'
import GeoJSON from 'ol/format/GeoJSON'
import { circular } from 'ol/geom/Polygon'

type ExclusionZoneData = {
  name: string
  address: string
  geometry:
    | { type: 'Polygon'; coordinates: number[][][] }
    | { type: 'Point'; coordinates: number[]; radiusMetres: number }
}

export default function buildExclusionZoneFeatures(zones: ExclusionZoneData[] | null): Feature[] {
  const geoJson = new GeoJSON()
  return (zones ?? []).map(zone => {
    const properties = { name: zone.name, address: zone.address }
    const { geometry } = zone
    switch (geometry.type) {
      case 'Polygon':
        return geoJson.readFeature(
          { type: 'Feature', properties, geometry },
          { dataProjection: 'EPSG:4326', featureProjection: 'EPSG:3857' },
        ) as Feature
      case 'Point': {
        const [longitude, latitude] = geometry.coordinates
        if (
          !Number.isFinite(longitude) ||
          !Number.isFinite(latitude) ||
          !Number.isFinite(geometry.radiusMetres) ||
          geometry.radiusMetres <= 0
        ) {
          throw new Error(`Invalid point or radius for exclusion zone "${zone.name}"`)
        }
        return new Feature({
          ...properties,
          geometry: circular([longitude, latitude], geometry.radiusMetres, 64).transform('EPSG:4326', 'EPSG:3857'),
        })
      }
      default:
        throw new Error(`Unsupported geometry for exclusion zone "${zone.name}"`)
    }
  })
}
