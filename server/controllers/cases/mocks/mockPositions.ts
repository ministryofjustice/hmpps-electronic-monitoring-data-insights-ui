import { CaseLocationBasePosition, getGeolocationMechanism } from '../../../services/caseLocationActivityService'
import popTrail from './pop_trail.json'

interface Location {
  locations: CaseLocationBasePosition[]
}

const MOCK_CRNS = ['X888888']

export const isMockCrn = (crn: string): boolean => {
  return process.env.ENVIRONMENT_NAME === 'dev' && MOCK_CRNS.includes(crn)
}

export const getMockPositions = () => {
  const mockData = popTrail
  return mockData.locations.map((location: CaseLocationBasePosition) => {
    const { lbs, deviceId, hdop, geometry, satellite, ...cleanedLocation } = location
    if (typeof lbs === 'number') {
      cleanedLocation.geolocationMechanism = getGeolocationMechanism(lbs) || 'Unknown'
    }
    return cleanedLocation
  })
}
