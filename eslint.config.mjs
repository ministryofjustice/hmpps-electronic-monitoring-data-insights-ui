import hmppsConfig from '@ministryofjustice/eslint-config-hmpps'

export default hmppsConfig({
  extraPathsAllowingDevDependencies: ['.allowed-scripts.mjs', 'accessibility_tests/**/*', 'playwright.config.ts'],
})
