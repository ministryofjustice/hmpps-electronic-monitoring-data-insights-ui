import {
  defaultClient,
  DistributedTracingModes,
  getCorrelationContext,
  setup,
  type TelemetryClient,
} from 'applicationinsights'
import { RequestHandler } from 'express'
import applicationInfo from '../applicationInfo'

type WebInstrumentationConfig = {
  name: string
  value: string | boolean | number
}

function addWebInstrumentationConfig(): void {
  const appInsightsConfig = (
    process.env.APPLICATIONINSIGHTS_CONFIGURATION_CONTENT
      ? JSON.parse(process.env.APPLICATIONINSIGHTS_CONFIGURATION_CONTENT)
      : {}
  ) as { webInstrumentationConfig?: WebInstrumentationConfig[] }
  const webInstrumentationConfig = Array.isArray(appInsightsConfig.webInstrumentationConfig)
    ? appInsightsConfig.webInstrumentationConfig.filter(({ name }) => name !== 'autoTrackPageVisitTime')
    : []

  process.env.APPLICATIONINSIGHTS_CONFIGURATION_CONTENT = JSON.stringify({
    ...appInsightsConfig,
    webInstrumentationConfig: [...webInstrumentationConfig, { name: 'autoTrackPageVisitTime', value: true }],
  })
}

export function defaultName(): string {
  const { applicationName: name } = applicationInfo()
  return name
}

export function version(): string {
  const { version: buildNumber } = applicationInfo()
  return buildNumber
}

export function initialiseAppInsights(): void {
  if (process.env.APPLICATIONINSIGHTS_CONNECTION_STRING) {
    // eslint-disable-next-line no-console
    console.log('Enabling azure application insights')

    addWebInstrumentationConfig()

    const appInsights = setup()
      .setDistributedTracingMode(DistributedTracingModes.AI_AND_W3C)
      .enableWebInstrumentation(true)

    appInsights.start()
  }
}

export function buildAppInsightsClient(applicationName = defaultName()): TelemetryClient {
  const appInsightsConnectionString = process.env.APPLICATIONINSIGHTS_CONNECTION_STRING
  if (appInsightsConnectionString) {
    defaultClient.context.tags['ai.cloud.role'] = applicationName
    defaultClient.context.tags['ai.application.ver'] = version()
    defaultClient.addTelemetryProcessor(envelope => {
      const telemetryItem = envelope.data.baseData
      if (telemetryItem?.url) {
        const excludedRequestUrls = ['/ping', '/metrics', '/health', '/info']
        if (excludedRequestUrls.some(url => telemetryItem.url.includes(url))) {
          return false
        }
      }
      return true
    })
    return defaultClient
  }
  return null
}

export function appInsightsMiddleware(): RequestHandler {
  return (req, res, next) => {
    res.prependOnceListener('finish', () => {
      const context = getCorrelationContext()
      if (context && req.route) {
        const path = req.route?.path
        const pathToReport = Array.isArray(path) ? `"${path.join('" | "')}"` : path
        context.customProperties.setProperty('operationName', `${req.method} ${pathToReport}`)
      }
    })
    next()
  }
}
