import fs from 'node:fs/promises'
import path from 'node:path'
import logger from '../../logger'

export interface Position {
  positionId: number
  latitude: number
  longitude: number
  precision: number
  speed: number
  direction: number
  timestamp: string
  geolocationMechanism: string
  sequenceNumber: number
}

export interface PositionData {
  data: Position[]
}

export interface Filters {
  from?: string
  to?: string
}

const ROWS_PATH = process.env.TRAIL_JSON_PATH ?? path.resolve(process.cwd(), './scripts/data/pop_trail.json')

export default class TrailService {
  private cache: PositionData | null = null

  private readonly rowsPath: string

  constructor(rowsPath: string | null = null) {
    this.rowsPath = rowsPath || ROWS_PATH
  }

  async getTrailJson(): Promise<PositionData> {
    if (this.cache) return this.cache

    const content = await fs.readFile(ROWS_PATH, 'utf-8')
    this.cache = JSON.parse(content) as PositionData
    // console.log('cache === ', this.cache)
    return this.cache
  }

  filterByDate(positionJson: PositionData, filters: Filters): Position[] {
    const { from, to } = filters

    if (!from && !to) {
      logger.debug('No date filters applied, returning full data set.')
      return positionJson.data
    }

    const fromDate = from ? new Date(from) : null
    const toDate = to ? new Date(to) : null

    return {
      ...positionJson,
      data: positionJson.data.filter(position => {
        const date = new Date(position.timestamp)

        if (Number.isNaN(date.getTime())) {
          return false
        }

        const afterFrom = !fromDate || date >= fromDate
        const beforeTo = !toDate || date <= toDate

        return afterFrom && beforeTo
      }),
    }.data
  }
}
