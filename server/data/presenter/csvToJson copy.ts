// import fs from 'node:fs';
// import readline from 'node:readline';
// import path from 'node:path';

// const inPath = path.resolve(process.cwd(), './server/data/geoData/test_trail.csv');
// const outPath = './assets/data/out.geo.json';

// if (!inPath) {
//     console.error('Usage: enter an csv input file');
//     process.exit(1);
// }

// const rl = readline.createInterface({
//     input: fs.createReadStream(inPath),
//     crlfDelay: Infinity
// });

// let header;
// const rows = [];

// for await (const line of rl) {
//     if (!header) {
//         header = line.split(',').map(s => s.trim());
//         continue;
//     }
//     if (!line.trim()) continue;
//     const cols = line.split(',').map(s => s.trim());
   
//     const row = Object.fromEntries(
//         header.map((key, i) => [key, cols[i] ?? ''] as const)
//     ) as Record<string, string>;
//     // as Record<string, string>
//     const lat = parseFloat(row.position_latitude);
//     const lon = parseFloat(row.position_longitude);
//     const ts = row.position_gps_date;

//     if (Number.isFinite(lat) && Number.isFinite(lon) && ts) {
//         rows.push({ lat, lon, ts});
//     }
// }

// rows.sort((a, b) => a.ts.localeCompare(b.ts));

// const byDay = rows.reduce((m, r) => {
//     const day = r.ts.slice(0, 10);
//     (m[day] ??= []).push([r.lon, r.lat]);
//     return m;
// }, {});

// const features = Object.entries(byDay).map(([date, coords]) => ({ type: 'Feature', properties: { date }, geometry: {type: 'LineString', coordinates: coords} }));

// const geojson = { type: 'FeatureCollection', features};

// fs.writeFileSync(outPath, JSON.stringify(geojson));
// console.log(`Wrote ${outPath} with ${features.length} day tracks and ${rows.length} positions.`)