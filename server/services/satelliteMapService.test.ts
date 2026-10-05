import { Readable } from 'stream'

import nock from 'nock'

import SatelliteMapService, { type SatelliteMapResponse } from './satelliteMapService'

const secret = '11111111-2222-3333-4444-555555555555'
const capabilitiesUrl = `https://www.getmapping.com/GmWMTS/${secret}/APGB/1.0.0/WMTSCapabilities.xml`
const proxyBaseUrl = 'https://example.test/map/satellite/wmts/'

const service = (overrides: Partial<ConstructorParameters<typeof SatelliteMapService>[0]> = {}) =>
  new SatelliteMapService(
    {
      capabilitiesUrl,
      allowedHostname: 'www.getmapping.com',
      timeout: { response: 1000, deadline: 2000 },
      ...overrides,
    },
    proxyBaseUrl,
  )

const bodyAsBuffer = async (response: SatelliteMapResponse): Promise<Buffer> => {
  if (Buffer.isBuffer(response.body)) return response.body
  if (!response.body) return Buffer.alloc(0)
  const chunks: Buffer[] = []
  for await (const chunk of response.body as Readable) chunks.push(Buffer.from(chunk))
  return Buffer.concat(chunks)
}

afterEach(() => {
  nock.cleanAll()
})

describe('WMTS capabilities', () => {
  const capabilities = `<?xml version="1.0" encoding="UTF-8"?>
    <Capabilities xmlns:xlink="http://www.w3.org/1999/xlink">
      <ServiceMetadataURL xlink:href="${capabilitiesUrl}" />
      <Get xlink:href="https://www.getmapping.com/GmWMTS/${secret}/APGB.wmtsx?" />
      <ResourceURL resourceType="tile" format="image/jpeg"
        template="https://www.getmapping.com/GmWMTS/${secret}/APGB/1.0.0/latest/default/EPSG:3857/{TileMatrix}/{TileRow}/{TileCol}.jpg" />
    </Capabilities>`

  it('rewrites every credential-bearing provider URL to the same-origin proxy', async () => {
    nock('https://www.getmapping.com')
      .get(`/GmWMTS/${secret}/APGB/1.0.0/WMTSCapabilities.xml`)
      .matchHeader('accept', 'application/xml,text/xml')
      .reply(200, capabilities, {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=300',
      })

    const result = await service().get('APGB/1.0.0/WMTSCapabilities.xml', {})
    const body = (await bodyAsBuffer(result)).toString()

    expect(result.statusCode).toBe(200)
    expect(result.headers['content-type']).toBe('application/xml')
    expect(result.headers['cache-control']).toBe('public, max-age=300')
    expect(body).toContain(`${proxyBaseUrl}APGB.wmtsx?`)
    expect(body).toContain(`${proxyBaseUrl}APGB/1.0.0/latest/default/EPSG:3857/{TileMatrix}/{TileRow}/{TileCol}.jpg`)
    expect(body).not.toContain(secret)
    expect(body).not.toContain('getmapping.com')
    expect(nock.isDone()).toBe(true)
  })

  it('does not return capabilities if the credential remains elsewhere in the document', async () => {
    nock('https://www.getmapping.com')
      .get(`/GmWMTS/${secret}/APGB/1.0.0/WMTSCapabilities.xml`)
      .reply(200, `<Capabilities><Title>${secret}</Title></Capabilities>`, {
        'Content-Type': 'text/xml',
      })

    await expect(service().get('APGB/1.0.0/WMTSCapabilities.xml', {})).rejects.toMatchObject({
      statusCode: 502,
      message: 'Satellite map capabilities could not be safely sanitised',
    })
  })

  it('rejects capabilities query parameters', async () => {
    await expect(
      service().get('APGB/1.0.0/WMTSCapabilities.xml', { redirect: 'https://attacker.example' }),
    ).rejects.toMatchObject({ statusCode: 400 })
  })

  it('rejects an upstream non-XML success response', async () => {
    nock('https://www.getmapping.com')
      .get(`/GmWMTS/${secret}/APGB/1.0.0/WMTSCapabilities.xml`)
      .reply(200, '<html>Not XML</html>', { 'Content-Type': 'text/html' })

    await expect(service().get('APGB/1.0.0/WMTSCapabilities.xml', {})).rejects.toMatchObject({ statusCode: 502 })
  })
})

describe('WMTS tiles', () => {
  it('streams a validated REST tile and preserves its response metadata', async () => {
    const tile = Buffer.from('jpeg bytes')
    nock('https://www.getmapping.com')
      .get(`/GmWMTS/${secret}/APGB/1.0.0/latest/default/EPSG:3857/12/1345/2048.jpg`)
      .reply(200, tile, {
        'Content-Type': 'image/jpeg',
        ETag: 'tile-etag',
      })

    const result = await service().get('APGB/1.0.0/latest/default/EPSG:3857/12/1345/2048.jpg', {})

    expect(result.statusCode).toBe(200)
    expect(result.headers['content-type']).toBe('image/jpeg')
    expect(result.headers.etag).toBe('tile-etag')
    expect(await bodyAsBuffer(result)).toEqual(tile)
    expect(nock.isDone()).toBe(true)
  })

  it('supports a validated WMTS KVP GetTile request', async () => {
    const query = {
      SERVICE: 'WMTS',
      REQUEST: 'GetTile',
      VERSION: '1.0.0',
      LAYER: 'latest',
      STYLE: 'default',
      FORMAT: 'image/png',
      TILEMATRIXSET: 'EPSG:3857',
      TILEMATRIX: '12',
      TILEROW: '1345',
      TILECOL: '2048',
    }
    nock('https://www.getmapping.com')
      .get(`/GmWMTS/${secret}/APGB.wmtsx`)
      .query(query)
      .reply(200, Buffer.from('png bytes'), { 'Content-Type': 'image/png' })

    const result = await service().get('APGB.wmtsx', query)

    expect(result.statusCode).toBe(200)
    expect(await bodyAsBuffer(result)).toEqual(Buffer.from('png bytes'))
    expect(nock.isDone()).toBe(true)
  })

  it.each([
    ['an unrelated provider path', 'another-feed/1.0.0/layer/default/EPSG:3857/1/2/3.png', {}, 404],
    ['path traversal', 'APGB/1.0.0/layer/default/EPSG:3857/1/../3.png', {}, 400],
    [
      'an arbitrary query parameter',
      'APGB/1.0.0/layer/default/EPSG:3857/1/2/3.png',
      { upstream: 'https://attacker.example' },
      400,
    ],
    [
      'a non-tile KVP operation',
      'APGB.wmtsx',
      {
        service: 'WMTS',
        request: 'GetCapabilities',
        version: '1.0.0',
        layer: 'latest',
        format: 'image/png',
        tilematrixset: 'EPSG:3857',
        tilematrix: '1',
        tilerow: '2',
        tilecol: '3',
      },
      400,
    ],
  ])('rejects %s', async (_description, resourcePath, query, statusCode) => {
    await expect(service().get(resourcePath, query)).rejects.toMatchObject({ statusCode })
    expect(nock.isDone()).toBe(true)
  })

  it('does not pass through a successful non-image response as a tile', async () => {
    nock('https://www.getmapping.com')
      .get(`/GmWMTS/${secret}/APGB/1.0.0/latest/default/EPSG:3857/12/1345/2048.jpg`)
      .reply(200, '<Exception>Invalid tile</Exception>', { 'Content-Type': 'application/xml' })

    await expect(service().get('APGB/1.0.0/latest/default/EPSG:3857/12/1345/2048.jpg', {})).rejects.toMatchObject({
      statusCode: 502,
    })
  })

  it('returns an upstream error status without exposing its body', async () => {
    nock('https://www.getmapping.com')
      .get(`/GmWMTS/${secret}/APGB/1.0.0/latest/default/EPSG:3857/12/1345/2048.jpg`)
      .reply(404, `Not found at ${capabilitiesUrl}`, { 'Content-Type': 'text/plain' })

    const result = await service().get('APGB/1.0.0/latest/default/EPSG:3857/12/1345/2048.jpg', {})

    expect(result.statusCode).toBe(404)
    expect(result.body).toBeUndefined()
  })

  it('returns a controlled error when the provider exceeds the deadline', async () => {
    nock('https://www.getmapping.com')
      .get(`/GmWMTS/${secret}/APGB/1.0.0/latest/default/EPSG:3857/12/1345/2048.jpg`)
      .delayConnection(50)
      .reply(200, Buffer.from('late tile'), { 'Content-Type': 'image/jpeg' })

    await expect(
      service({ timeout: { response: 10, deadline: 20 } }).get(
        'APGB/1.0.0/latest/default/EPSG:3857/12/1345/2048.jpg',
        {},
      ),
    ).rejects.toMatchObject({
      statusCode: 504,
      message: 'Satellite map provider timed out',
    })
  })
})

describe('configuration', () => {
  it('is safely unavailable until the secret URL is supplied', async () => {
    await expect(service({ capabilitiesUrl: '' }).get('APGB/1.0.0/WMTSCapabilities.xml', {})).rejects.toMatchObject({
      statusCode: 503,
      message: 'Satellite map is not configured',
    })
  })

  it.each([
    'http://www.getmapping.com/GmWMTS/key/APGB/1.0.0/WMTSCapabilities.xml',
    'https://attacker.example/GmWMTS/key/APGB/1.0.0/WMTSCapabilities.xml',
    'https://www.getmapping.com/GmWMTS/key/APGB/1.0.0/WMTSCapabilities.xml?redirect=true',
    'https://user:password@www.getmapping.com/GmWMTS/key/APGB/1.0.0/WMTSCapabilities.xml',
    'https://www.getmapping.com/<service_type>/<uuid>/APGB/1.0.0/WMTSCapabilities.xml',
  ])('rejects an unsafe or incomplete capabilities URL: %s', async invalidUrl => {
    await expect(
      service({ capabilitiesUrl: invalidUrl }).get('APGB/1.0.0/WMTSCapabilities.xml', {}),
    ).rejects.toMatchObject({ statusCode: 503, message: 'Satellite map configuration is invalid' })
  })
})
