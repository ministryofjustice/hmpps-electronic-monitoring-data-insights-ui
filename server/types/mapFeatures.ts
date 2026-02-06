export type Coordinate = [number, number]

export type LineFeature = {
  type: 'Feature'
  id: string
  properties: {
    '@id': string
    direction: number
  }
  geometry: {
    type: 'LineString'
    coordinates: Array<Coordinate>
  }
}

export type PointFeature = {
  type: 'Feature'
  id: string
  properties: {
    '@id': string
    confidence: number
    type: string
    sequenceNumber: number

    overlayTemplateId?: string
    displaySpeed?: string
    displayDirection?: string
    displayGeolocationMechanism?: string
    displayTimestamp?: string
    displayConfidence?: string
    displayLatitude?: string
    displayLongitude?: string
  }
  geometry: {
    type: 'Point'
    coordinates: Coordinate
  }
}

export type GeoJsonData = {
  points: Array<PointFeature>
  lines: Array<LineFeature>
}
