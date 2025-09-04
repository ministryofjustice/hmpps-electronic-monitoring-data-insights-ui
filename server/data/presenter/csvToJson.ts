import fs from 'node:fs';
import readline from 'node:readline';
import path from 'node:path';
//server/data/geoData/test_trail.csv
const inPath = path.resolve(process.cwd(), './server/data/geoData/test_trail.csv');
const outPath = 'out.geo.json';

if (!inPath) {
    console.error('Usage: enter an csv input file');
    process.exit(1);
}

const rl = readline.createInterface({
    input: fs.createReadStream(inPath),
    crlfDelay: Infinity
});

interface DailyDataMap {
  [day: string]: { lat: number; lng: number; label: number; accuracy: number; }[];
}

interface MapRow {
  ping: number;  
  lat: number; 
  lng: number; 
  accuracy: number;
  ts: string;
}

// The current file is a CommonJS module and cannot use 'await' at the top level.ts
async function start() {
    let header;
    const rows = [];
    for await (const line of rl) {
    if (!header) {
        header = line.split(',').map(s => s.trim());
        continue;
    }
    if (!line.trim()) continue;
    const cols = line.split(',').map(s => s.trim());
   
    const row = Object.fromEntries(
        header.map((key, i) => [key, cols[i] ?? ''] as const)
    ) as Record<string, string>;
    // as Record<string, string>
    const lat = parseFloat(row.position_latitude);
    const lon = parseFloat(row.position_longitude);
    // accuracy
    const accuracy = parseFloat(row.position_precision);
    
    const ping = parseInt(row.ping);
    const ts = row.position_gps_date;

    if (Number.isFinite(lat) && Number.isFinite(lon) && ts) {
        rows.push({ lat, lng: lon, ts, ping, accuracy});
    }
}

rows.sort((a, b) => a.ts.localeCompare(b.ts));

const byDay = rows.reduce((m, r) => {
    const day: string = r.ts.slice(0, 10);
    // Element implicitly has an 'any' type because expression of type 'string' can't be used to index type '{}'.
    //No index signature with a parameter of type 'string' was found on type '{}'.
    (m[day] ??= []).push({lat: r.lat, lng: r.lng, label: r.ping, accuracy: r.accuracy });
    return m;
}, {} as any);

 // lat: position_latitude, lng: position_longitude, label: ping, accuracy: position_precision
const features = Object.entries(byDay).map(([date, points]) => ({  dates: { date }, points: points  }));

const geojson = { features };

fs.writeFileSync(outPath, JSON.stringify(geojson));
console.log(`Wrote ${outPath} with ${features.length} day tracks and ${rows.length} positions.`)
}

start();