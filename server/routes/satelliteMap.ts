import { Router } from 'express'

import asyncMiddleware from '../middleware/asyncMiddleware'
import type SatelliteMapService from '../services/satelliteMapService'
import SatelliteMapError from '../services/satelliteMapError'

const RESPONSE_HEADERS = [
  'cache-control',
  'content-length',
  'content-type',
  'etag',
  'expires',
  'last-modified',
] as const

export default function satelliteMapRoutes(satelliteMapService: SatelliteMapService): Router {
  const router = Router()

  router.get(
    '/map/satellite/wmts/*',
    asyncMiddleware(async (req, res, next) => {
      try {
        const upstream = await satelliteMapService.get(req.params[0], req.query)

        res.status(upstream.statusCode)
        if (!upstream.body) {
          res.end()
          return
        }

        RESPONSE_HEADERS.forEach(name => {
          const value = upstream.headers[name]
          if (value !== undefined) res.setHeader(name, value)
        })
        if (Buffer.isBuffer(upstream.body)) {
          res.send(upstream.body)
          return
        }

        upstream.body.once('error', () => res.destroy())
        upstream.body.pipe(res)
      } catch (error) {
        if (error instanceof SatelliteMapError) {
          res.status(error.statusCode).type('text/plain').send(error.message)
          return
        }
        next(error)
      }
    }),
  )

  return router
}
