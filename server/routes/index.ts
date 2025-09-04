import { type RequestHandler, Router } from 'express'

import asyncMiddleware from '../middleware/asyncMiddleware'
import type { Services } from '../services'
import { Page } from '../services/auditService'
import populateSessionData from '../middleware/populateSessionData'
import { filterByDate, Filters, getTrailGeoJson } from '../services/trailServices'
import { TrailPresenter } from '../presenters/TrailPresenter'

export default function routes({ auditService, emdiService }: Services): Router {
  const router = Router()
  const get = (path: string | string[], handler: RequestHandler) => router.get(path, asyncMiddleware(handler))

  get('/', async (req, res, next) => {
    // const points = [
    //   {
    //     lon: -0.1278,
    //     lat: 51.5074,
    //     overlayTemplateId: 'overlay-template-location-point',
    //     displayTimeStamp: new Date().toISOString(),
    //   },
    //   {
    //     lon: -0.13,
    //     lat: 51.5,
    //     overlayTemplateId: 'overlay-template-location-point',
    //     displayTimeStamp: new Date().toISOString(),
    //   },
    // ]

    // const lines = [
    //   {
    //     coords: [
    //       [-0.14, 51.5],
    //       [-0.13, 51.505],
    //       [-0.1278, 51.5074],
    //     ],
    //   },
    // ]

        await auditService.logPageView(Page.EXAMPLE_PAGE, { who: res.locals.user.username, correlationId: req.id })
        const currentTime = await emdiService.getCurrentTime()

        


  
        const filters: Filters = {from: req.query.from as string, to: req.query.to as string}
    
        const allGeo = await getTrailGeoJson()
        const filtered = filterByDate(allGeo, filters)
    
        const presenters = new TrailPresenter(filtered, filters)
        const vm = presenters.view()
      //  console.log('vm is', vm)
        vm.mojMapProps.cspNonce = res.locals.cspNonce
        console.log('xxx res.locals.cspNonce', res.locals.cspNonce)
      //  const points = vm.mojMapProps.geoData.points;
      //  const lines = vm.mojMapProps.geoData.lines;

    res.render('pages/index', {
      currentTime,
      vm
    })
  })

  router.use(populateSessionData)

  return router
}
