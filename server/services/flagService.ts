import { FliptClient } from '@flipt-io/flipt-client-js'
import logger from '../../logger'
import config from '../config'
import FeatureFlags, { featureFlagKeys } from '../models/FeatureFlags'

export default class FlagService {
  async getFlags(context: { username?: string }): Promise<FeatureFlags> {
    const fliptClient = await FliptClient.init({
      namespace: config.flipt.namespace,
      url: config.flipt.url,
      updateInterval: 120,
    })

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

      if (result.flagKey === flagKey) {
        featureFlags[featureFlagName] = result.enabled === true
      } else {
        logger.warn(`Expected response for flag ${flagKey}, got ${result.flagKey} - defaulting to false`)
        featureFlags[featureFlagName] = false
      }
    }

    return featureFlags
  }
}
