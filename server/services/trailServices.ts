import fs from 'node:fs/promises';
import path from 'node:path';

export type Filters = {from?: string, to?: string};

type Row = {
    position_lat: string | number;
    position_long: string | number;
    position_gps_date: string;
}



const ROWS_PATH = process.env.TRAIL_JSON_PATH ?? path.resolve(__dirname, '../assets/data/out.geo.json');

let cache: any | null = null;

export async function getTrailGeoJson(): Promise<any> {
    console.log(' ROWS_PATH ', ROWS_PATH)
    
    if (cache) return cache;
    const text = await fs.readFile(ROWS_PATH, 'utf-8');
    cache = JSON.parse(text);
    console.log('cache === ', cache)
    return cache;
}

export function filterByDate(geoJson: any, filters: Filters) {
    const {from, to} = filters;
    if (!from && !to) return geoJson;

    const fromDate = from ? new Date(from) : null;
    const toDate = to ? new Date(to) : null;

    const features = geoJson.features.filter((f: any) => {
        const date = new Date(f.properties?.date);
        return (!fromDate || date >= fromDate) && (!toDate || date <= toDate);
    });

    return {...geoJson, features}
}