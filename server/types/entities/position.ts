import GeolocationMechanism from './geolocationMechanism'

type Position = {
  positionId: number
  latitude: number
  longitude: number
  precision: number
  speed: number
  direction: number
  timestamp: string
  geolocationMechanism: GeolocationMechanism
  sequenceNumber: number
}

export default Position
