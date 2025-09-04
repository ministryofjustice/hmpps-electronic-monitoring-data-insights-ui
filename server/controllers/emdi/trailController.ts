import { NextFunction, RequestHandler } from "express";
import { TrailPresenter } from "../../presenters/TrailPresenter";
import { filterByDate, getTrailGeoJson } from "../../services/trailServices";


type TrailQuery = {from?: string, to?: string}
export default async function get(
    req: RequestHandler<unknown, unknown, unknown, TrailQuery>, 
    res: Response, 
    next: NextFunction
)  {
    try {
        const filters = {
            from: (req.query.from as string) || undefined,
            to: (req.query.to as string) || undefined,
        };
        const allGeo = await getTrailGeoJson();
        const filtered = filterByDate(allGeo, filters);
        res.render('trail/index', new TrailPresenter(filtered, filters).view());
    } catch (e) { 
        next(e); 
    }
}