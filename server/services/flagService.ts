import { FliptClient } from '@flipt-io/flipt-client-js/node'
import logger from '../../logger'
import config from '../config'
import FeatureFlags, { featureFlagKeys } from '../models/FeatureFlags'

type NodeFliptClientInstance = InstanceType<typeof FliptClient> & { close: () => void }

export default class FlagService {
  private fliptClient?: NodeFliptClientInstance

  private fliptClientPromise?: Promise<NodeFliptClientInstance>

  private closed = false

  private getClient(): Promise<NodeFliptClientInstance> {
    if (this.fliptClient) return Promise.resolve(this.fliptClient)
    if (this.closed) return Promise.reject(new Error('Flipt client is closed'))

    if (!this.fliptClientPromise) {
      this.fliptClientPromise = FliptClient.init({
        namespace: config.flipt.namespace,
        url: config.flipt.url,
        updateInterval: 120,
      })
        .then((client: NodeFliptClientInstance) => {
          if (this.closed) {
            client.close()
          } else {
            this.fliptClient = client
          }
          return client
        })
        .catch((error: unknown) => {
          this.fliptClientPromise = undefined
          throw error
        })
    }

    return this.fliptClientPromise
  }

  async getFlags(context: { username?: string }): Promise<FeatureFlags> {
    const fliptClient = await this.getClient()

    const featureFlags = new FeatureFlags()
    const flagList = Object.entries(featureFlagKeys)
    const entityId = context.username?.toLowerCase() || 'anonymous'
    const evaluationContext = {
      ...(context.username ? { username: context.username.toLowerCase() } : {}),
    }

    for (const [featureFlagName, flagKey] of flagList) {
      const result = fliptClient.evaluateBoolean({
        flagKey,
        entityId,
        context: evaluationContext,
      })

      if (result?.flagKey === flagKey) {
        featureFlags[featureFlagName] = result.enabled === true
      } else {
        logger.warn(`Expected response for flag ${flagKey}, got ${result?.flagKey} - defaulting to false`)
        featureFlags[featureFlagName] = false
      }
    }
    return featureFlags
  }

  close(): void {
    this.closed = true
    this.fliptClient?.close()
    this.fliptClient = undefined
    this.fliptClientPromise = undefined
  }
}
