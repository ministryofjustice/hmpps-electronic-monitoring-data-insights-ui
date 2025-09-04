type Point = {
  latitude: number
  longitude: number
}

type Location = {
  locationRef: number
  point: Point
  confidenceCircle: number
  speed: number
  direction: number
  timestamp: string
  geolocationMechanism: number
}

export { Location, Point }
