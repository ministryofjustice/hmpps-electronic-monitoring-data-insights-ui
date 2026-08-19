/* eslint-disable lines-between-class-members */
export default class FeatureFlags {
  [index: string]: boolean
  enablePingCardNavigation = false
  enableExclusionZones = false
}

export type FeatureFlagName = 'enableHeatmap' | 'enablePingCardNavigation' | 'enableExclusionZones'

export const featureFlagKeys: Record<FeatureFlagName, string> = {
  enablePingCardNavigation: 'enable-ping-card-navigation',
  enableHeatmap: 'enable-heatmap',
  enableExclusionZones: 'enable-exclusion-zones',
}
