import fs from 'node:fs'
import path from 'node:path'
import Papa from 'papaparse'
import Position from '../server/types/entities/position'
import type GeolocationMechanism from '../server/types/entities/geolocationMechanism'

const inPath = path.resolve(process.cwd(), './data/pop_trail.csv')
const outPath = path.resolve(process.cwd(), './data/pop_trail.json')

const getGeolocationMechanism = (value: number): GeolocationMechanism | undefined => {
  const mapping: Record<number, GeolocationMechanism> = {
    1: 'GPS',
    4: 'RF',
    5: 'LBS',
    6: 'WIFI',
  }
  return mapping[value]
}

type CsvRow = Record<string, string>

async function start() {
  const data = fs.readFileSync(inPath, 'utf-8')

  const parsed = Papa.parse<CsvRow>(data, {
    header: true,
    skipEmptyLines: true,
    dynamicTyping: false, // Keep as strings for now
    transformHeader: header => header.trim().replace(/"/g, ''),
  })

  const rows: Position[] = parsed.data.map((row, index) => ({
    positionId: parseInt(row.position_id, 10),
    latitude: parseFloat(row.position_latitude),
    longitude: parseFloat(row.position_longitude),
    precision: parseFloat(row.position_precision),
    speed: parseFloat(row.position_speed),
    direction: parseFloat(row.position_direction),
    timestamp: row.position_gps_date,
    geolocationMechanism: getGeolocationMechanism(parseInt(row.position_lbs, 10)),
    sequenceNumber: index + 1,
  }))

  fs.writeFileSync(outPath, JSON.stringify({ data: rows }, null, 2))
  process.stdout.write(`Wrote ${outPath} with ${rows.length} positions.\n`)
}

start()
