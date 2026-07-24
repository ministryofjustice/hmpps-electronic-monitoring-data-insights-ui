/* eslint-disable lines-between-class-members */
export default class FeatureFlags {
  [index: string]: boolean
  enablePingCardNavigation = false
}

export type FeatureFlagName = 'enablePingCardNavigation'

export const featureFlagKeys: Record<FeatureFlagName, string> = {
  enablePingCardNavigation: 'enable-ping-card-navigation',
}
