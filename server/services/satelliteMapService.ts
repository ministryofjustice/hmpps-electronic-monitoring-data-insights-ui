import http, { type IncomingHttpHeaders, type IncomingMessage } from 'http'
import https from 'https'
import type { Readable } from 'stream'

import type { ParsedQs } from 'qs'
import SatelliteMapError from './satelliteMapError'

const CAPABILITIES_SUFFIX = '/1.0.0/WMTSCapabilities.xml'
const MAX_CAPABILITIES_BYTES = 2 * 1024 * 1024
const SAFE_IDENTIFIER = /^[A-Za-z0-9_.:~-]+$/
const IMAGE_CONTENT_TYPES = new Set(['image/jpeg', 'image/png'])

type SatelliteMapConfig = {
  capabilitiesUrl: string
  allowedHostname: string
  timeout: {
    response: number
    deadline: number
  }
}

type ProviderSettings = {
  capabilitiesUrl: URL
  credentialBaseUrl: URL
  credentialIdentifier: string
  capabilitiesPath: string
  feed: string
}

export type SatelliteMapResponse = {
  statusCode: number
  headers: IncomingHttpHeaders
  body?: Buffer | Readable
}

const singleQueryValue = (value: string | ParsedQs | (string | ParsedQs)[] | undefined): string | null =>
  typeof value === 'string' ? value : null

const normaliseContentType = (value: string | string[] | undefined): string => {
  const contentType = Array.isArray(value) ? value[0] : value
  return contentType?.split(';', 1)[0].trim().toLowerCase() ?? ''
}

const isSafeIdentifier = (value: string): boolean => value !== '.' && value !== '..' && SAFE_IDENTIFIER.test(value)

export default class SatelliteMapService {
  constructor(
    private readonly config: SatelliteMapConfig,
    private readonly proxyBaseUrl: string,
  ) {}

  async get(resourcePath: string, query: ParsedQs): Promise<SatelliteMapResponse> {
    const settings = this.providerSettings()

    if (resourcePath === settings.capabilitiesPath) {
      if (Object.keys(query).length) {
        throw new SatelliteMapError(400, 'Unsupported satellite map capabilities request')
      }
      return this.getCapabilities(settings)
    }

    this.validateTileRequest(resourcePath, query, settings.feed)
    const upstreamUrl = new URL(resourcePath, settings.credentialBaseUrl)
    Object.entries(query).forEach(([name, value]) => upstreamUrl.searchParams.set(name, singleQueryValue(value)!))

    const upstream = await this.request(upstreamUrl, 'image/png,image/jpeg')
    const statusCode = upstream.statusCode ?? 502
    if (statusCode < 200 || statusCode >= 300) {
      upstream.resume()
      return { statusCode, headers: upstream.headers }
    }

    if (!IMAGE_CONTENT_TYPES.has(normaliseContentType(upstream.headers['content-type']))) {
      upstream.resume()
      throw new SatelliteMapError(502, 'Satellite map provider returned an invalid tile response')
    }

    return { statusCode, headers: upstream.headers, body: upstream }
  }

  private providerSettings(): ProviderSettings {
    if (!this.config.capabilitiesUrl) {
      throw new SatelliteMapError(503, 'Satellite map is not configured')
    }

    let capabilitiesUrl: URL
    try {
      capabilitiesUrl = new URL(this.config.capabilitiesUrl)
    } catch {
      throw new SatelliteMapError(503, 'Satellite map configuration is invalid')
    }

    if (
      capabilitiesUrl.protocol !== 'https:' ||
      capabilitiesUrl.hostname !== this.config.allowedHostname ||
      capabilitiesUrl.username ||
      capabilitiesUrl.password ||
      capabilitiesUrl.search ||
      capabilitiesUrl.hash ||
      !capabilitiesUrl.pathname.endsWith(CAPABILITIES_SUFFIX)
    ) {
      throw new SatelliteMapError(503, 'Satellite map configuration is invalid')
    }

    const feedPath = capabilitiesUrl.pathname.slice(0, -CAPABILITIES_SUFFIX.length)
    const pathParts = feedPath.split('/').filter(Boolean)
    if (pathParts.length < 3 || pathParts.some(part => !isSafeIdentifier(part))) {
      throw new SatelliteMapError(503, 'Satellite map configuration is invalid')
    }

    const feed = pathParts.at(-1)!
    const credentialIdentifier = decodeURIComponent(pathParts.at(-2)!)
    if (!credentialIdentifier || credentialIdentifier.includes('<') || credentialIdentifier.includes('>')) {
      throw new SatelliteMapError(503, 'Satellite map configuration is invalid')
    }

    const credentialBaseUrl = new URL(capabilitiesUrl)
    credentialBaseUrl.pathname = `/${pathParts.slice(0, -1).join('/')}/`

    return {
      capabilitiesUrl,
      credentialBaseUrl,
      credentialIdentifier,
      capabilitiesPath: `${feed}${CAPABILITIES_SUFFIX}`,
      feed,
    }
  }

  private async getCapabilities(settings: ProviderSettings): Promise<SatelliteMapResponse> {
    const upstream = await this.request(settings.capabilitiesUrl, 'application/xml,text/xml')
    const statusCode = upstream.statusCode ?? 502
    if (statusCode < 200 || statusCode >= 300) {
      upstream.resume()
      return { statusCode, headers: upstream.headers }
    }

    const contentType = normaliseContentType(upstream.headers['content-type'])
    if (!contentType.includes('xml')) {
      upstream.resume()
      throw new SatelliteMapError(502, 'Satellite map provider returned an invalid capabilities response')
    }

    const source = await this.readCapabilities(upstream)
    const body = this.rewriteCapabilities(source, settings)

    return {
      statusCode,
      headers: { ...upstream.headers, 'content-length': Buffer.byteLength(body).toString() },
      body: Buffer.from(body),
    }
  }

  private rewriteCapabilities(source: string, settings: ProviderSettings): string {
    const proxyBaseUrl = this.proxyBaseUrl.endsWith('/') ? this.proxyBaseUrl : `${this.proxyBaseUrl}/`
    const secureProviderBase = settings.credentialBaseUrl.href
    const insecureProviderBase = secureProviderBase.replace(/^https:/, 'http:')
    const rewritten = source.split(secureProviderBase).join(proxyBaseUrl).split(insecureProviderBase).join(proxyBaseUrl)

    if (rewritten.includes(settings.credentialIdentifier)) {
      throw new SatelliteMapError(502, 'Satellite map capabilities could not be safely sanitised')
    }

    return rewritten
  }

  private validateTileRequest(resourcePath: string, query: ParsedQs, feed: string): void {
    const queryEntries = Object.entries(query)

    if (resourcePath === `${feed}.wmtsx`) {
      const allowedNames = new Set([
        'service',
        'request',
        'version',
        'layer',
        'style',
        'format',
        'tilematrixset',
        'tilematrix',
        'tilerow',
        'tilecol',
      ])
      const values = new Map<string, string>()

      queryEntries.forEach(([name, value]) => {
        const normalisedName = name.toLowerCase()
        const stringValue = singleQueryValue(value)
        if (!allowedNames.has(normalisedName) || stringValue === null || values.has(normalisedName)) {
          throw new SatelliteMapError(400, 'Invalid satellite map tile request')
        }
        values.set(normalisedName, stringValue)
      })

      const requiredIdentifiers = ['layer', 'tilematrixset', 'tilematrix']
      if (
        values.get('service')?.toUpperCase() !== 'WMTS' ||
        values.get('request')?.toUpperCase() !== 'GETTILE' ||
        values.get('version') !== '1.0.0' ||
        !IMAGE_CONTENT_TYPES.has(values.get('format')?.toLowerCase() ?? '') ||
        requiredIdentifiers.some(name => !isSafeIdentifier(values.get(name) ?? '')) ||
        (values.has('style') && !isSafeIdentifier(values.get('style')!)) ||
        !/^\d+$/.test(values.get('tilerow') ?? '') ||
        !/^\d+$/.test(values.get('tilecol') ?? '')
      ) {
        throw new SatelliteMapError(400, 'Invalid satellite map tile request')
      }
      return
    }

    if (queryEntries.some(([name, value]) => name.toLowerCase() !== 'format' || singleQueryValue(value) === null)) {
      throw new SatelliteMapError(400, 'Invalid satellite map tile request')
    }
    const format = queryEntries.length ? singleQueryValue(queryEntries[0][1])?.toLowerCase() : undefined
    if (format && !IMAGE_CONTENT_TYPES.has(format)) {
      throw new SatelliteMapError(400, 'Invalid satellite map tile request')
    }

    const prefix = `${feed}/1.0.0/`
    if (!resourcePath.startsWith(prefix)) {
      throw new SatelliteMapError(404, 'Satellite map resource not found')
    }

    const tileParts = resourcePath.slice(prefix.length).split('/')
    const tileColumn = tileParts.at(-1) ?? ''
    const tileRow = tileParts.at(-2) ?? ''
    const columnMatch = /^(\d+)(?:\.(?:png|jpe?g))?$/i.exec(tileColumn)
    if (
      tileParts.length < 5 ||
      tileParts.length > 8 ||
      tileParts.slice(0, -2).some(part => !isSafeIdentifier(part)) ||
      !/^\d+$/.test(tileRow) ||
      !columnMatch
    ) {
      throw new SatelliteMapError(400, 'Invalid satellite map tile request')
    }
  }

  private request(url: URL, accept: string): Promise<IncomingMessage> {
    return new Promise((resolve, reject) => {
      const transport = url.protocol === 'https:' ? https : http
      let settled = false
      const fail = (error: SatelliteMapError) => {
        if (!settled) {
          settled = true
          reject(error)
        }
      }

      const request = transport.get(
        url,
        {
          headers: { accept, 'accept-encoding': 'identity' },
        },
        response => {
          settled = true
          resolve(response)
        },
      )

      const deadline = setTimeout(() => {
        request.destroy()
        fail(new SatelliteMapError(504, 'Satellite map provider timed out'))
      }, this.config.timeout.deadline)

      request.setTimeout(this.config.timeout.response, () => {
        request.destroy()
        fail(new SatelliteMapError(504, 'Satellite map provider timed out'))
      })
      request.once('error', () => fail(new SatelliteMapError(502, 'Satellite map provider request failed')))
      request.once('close', () => clearTimeout(deadline))
    })
  }

  private readCapabilities(response: IncomingMessage): Promise<string> {
    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = []
      let length = 0

      response.on('data', (chunk: Buffer) => {
        length += chunk.length
        if (length > MAX_CAPABILITIES_BYTES) {
          response.destroy()
          reject(new SatelliteMapError(502, 'Satellite map capabilities response is too large'))
          return
        }
        chunks.push(chunk)
      })
      response.once('end', () => resolve(Buffer.concat(chunks).toString('utf8')))
      response.once('error', () => reject(new SatelliteMapError(502, 'Satellite map provider request failed')))
    })
  }
}
