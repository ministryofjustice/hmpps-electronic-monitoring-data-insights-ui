import { RequestHandler } from 'express'
import EdmiService from '../../services/emdiService'

export default class EmdiController {
  constructor(private readonly service: EdmiService) {}

  view: RequestHandler = async (req, res) => {
    const { token } = res.locals.user
    const data = await this.service.getData(token)

    res.render('pages/emdi/index', {
      curfew: JSON.stringify(data),
    })
  }
}
