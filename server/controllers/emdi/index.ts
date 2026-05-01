import { RequestHandler } from 'express'
import EdmiService from '../../services/emdiService'

export default class EmdiController {
  constructor(private readonly service: EdmiService) {}

  view: RequestHandler = async (req, res) => {
    const { username } = res.locals.user
    const data = await this.service.getData(username)

    res.render('pages/emdi/index', {
      curfew: JSON.stringify(data),
    })
  }
}
