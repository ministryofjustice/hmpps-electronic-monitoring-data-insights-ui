import { FeatureCollection, LineString, Position } from "geojson";
import { Filters } from "../services/trailServices";


type Coord = [number, number];

interface MojMapPoint {
    coordinates: Coord;
    date?: string;
    i?: number;
}

interface MojMapLine {
    coordinates: Coord[];
    date?: string;
}

interface MojMapGeoDate {
    points: MojMapPoint[];
    lines: MojMapLine[];
}

interface MojMapProps {
    cspNonce?: string;
    usesInternalOverlays: boolean;
    controls: {
         scaleControl: string, 
        locationDisplay: string,
            zoomSlider: boolean 
    },
    geoData: MojMapGeoDate;
}

type TrailGeoJSON = FeatureCollection<LineString, {date: string}>

interface TrailViewModel {
    pageTitle: string;
    filters: Filters;
    mojMapProps: MojMapProps;
}

export class TrailPresenter {
    constructor(private readonly geoJson: any, private readonly filters: Filters) {}

    private toGeoData(sampleStep = 0): MojMapGeoDate {
        const lines: MojMapLine[] = this.geoJson.features.map((f: any)=> {
            const coords = (f.geometry.coordinates as Position[])
                .map(p => [Number(p[0]), Number(p[1])])
                .filter(([x,y]) => Number.isFinite(x) && Number.isFinite(y))
            return { coordinates: coords, date: f.properties?.date }
        })

        const points: MojMapPoint[] = sampleStep > 0 
            ? lines.flatMap(line =>
                line.coordinates
                    .filter((_, i) => i % sampleStep === 0)
                    .map((c,i) => ({ coordinates: c, date: line.date, i}))
            )
            : []
            console.log(' xx lines', lines)
            console.log(' xx points', points)
        return {lines, points}
    }

    view(): TrailViewModel {
        console.log('TrailPresenter geoJson', this.geoJson)
        return {
            pageTitle: 'PoP Trail Map',
            filters: this.filters,
            mojMapProps: {
                usesInternalOverlays: true,
                controls: { 
                    scaleControl: 'bar', 
                    locationDisplay: 'latlon',
                    zoomSlider: true 
                },
                geoData: this.toGeoData(25), 
            }
        };
    }
}