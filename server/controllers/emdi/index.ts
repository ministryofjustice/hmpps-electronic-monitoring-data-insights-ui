import { RequestHandler } from 'express' 
import EdmiService from '../../services/emdiService'
import { filterByDate, Filters, getTrailGeoJson } from '../../services/trailServices'
import { TrailPresenter } from '../../presenters/TrailPresenter'

export default class EmdiController {
  constructor(private readonly service: EdmiService) {}

  view: RequestHandler = async (req, res, next) => {
    const { token } = res.locals.user
    const data = await this.service.getData(token)
    const filters: Filters = {from: req.query.from as string, to: req.query.to as string}

    const allGeo = await getTrailGeoJson()
    const filtered = filterByDate(allGeo, filters)

    const presenters = new TrailPresenter(filtered, filters)
    const vm = presenters.view()

    res.render('pages/emdi/index', {
      curfew: JSON.stringify(data),
      vm
    })
  }
}
