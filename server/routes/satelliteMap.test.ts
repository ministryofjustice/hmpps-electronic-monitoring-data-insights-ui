import { Readable } from 'stream'

import express, { type RequestHandler } from 'express'
import request from 'supertest'

import asyncMiddleware from '../middleware/asyncMiddleware'
import SatelliteMapError from '../services/satelliteMapError'
import SatelliteMapService from '../services/satelliteMapService'
import satelliteMapRoutes from './satelliteMap'

const satelliteMapService = {
  get: jest.fn(),
} as unknown as jest.Mocked<SatelliteMapService>

const app = express()
const router = express.Router()
const get = (path: string, handler: RequestHandler) => router.get(path, asyncMiddleware(handler))
satelliteMapRoutes(satelliteMapService, get)
app.use(router)

beforeEach(() => jest.resetAllMocks())

it('returns sanitised capabilities with only safe response headers', async () => {
  satelliteMapService.get.mockResolvedValue({
    statusCode: 200,
    headers: {
      'content-type': 'application/xml',
      'cache-control': 'public, max-age=300',
      'set-cookie': ['provider-secret=value'],
      location: 'https://www.getmapping.com/secret',
    },
    body: Buffer.from('<Capabilities />'),
  })

  const response = await request(app).get('/map/satellite/wmts/APGB/1.0.0/WMTSCapabilities.xml').expect(200)

  expect(response.headers['content-type']).toMatch(/application\/xml/)
  expect(response.headers['cache-control']).toBe('public, max-age=300')
  expect(response.headers['set-cookie']).toBeUndefined()
  expect(response.headers.location).toBeUndefined()
  expect(response.text).toBe('<Capabilities />')
  expect(satelliteMapService.get).toHaveBeenCalledWith('APGB/1.0.0/WMTSCapabilities.xml', {})
})

it('streams tile responses', async () => {
  satelliteMapService.get.mockResolvedValue({
    statusCode: 200,
    headers: { 'content-type': 'image/png', etag: 'tile-etag' },
    body: Readable.from(Buffer.from('tile bytes')),
  })

  const response = await request(app)
    .get('/map/satellite/wmts/APGB/1.0.0/latest/default/EPSG:3857/1/2/3.png')
    .expect(200)

  expect(response.headers['content-type']).toBe('image/png')
  expect(response.headers.etag).toBe('tile-etag')
  expect(response.body).toEqual(Buffer.from('tile bytes'))
})

it('returns controlled proxy errors as plain text', async () => {
  satelliteMapService.get.mockRejectedValue(new SatelliteMapError(503, 'Satellite map is not configured'))

  const response = await request(app)
    .get('/map/satellite/wmts/APGB/1.0.0/WMTSCapabilities.xml')
    .expect('Content-Type', /text\/plain/)
    .expect(503)

  expect(response.text).toBe('Satellite map is not configured')
})

it('does not return an upstream error body', async () => {
  satelliteMapService.get.mockResolvedValue({
    statusCode: 404,
    headers: { 'content-type': 'text/plain', location: 'https://www.getmapping.com/secret' },
  })

  const response = await request(app)
    .get('/map/satellite/wmts/APGB/1.0.0/latest/default/EPSG:3857/1/2/3.png')
    .expect(404)

  expect(response.text).toBe('')
  expect(response.headers.location).toBeUndefined()
})
