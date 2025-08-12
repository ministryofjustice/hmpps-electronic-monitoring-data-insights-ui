import { RequestHandler } from 'express'
import EdmiService from '../../services/emdiService'

export default class EmdiController {
  constructor(private readonly service: EdmiService) {}

  view: RequestHandler = async (req, res) => {
    const data = await this.service.getCurrentTime()

    res.render('pages/emdi/index', {
      curfew: JSON.stringify({ message: `Hello World ${data}` }),
    })
  }
}
