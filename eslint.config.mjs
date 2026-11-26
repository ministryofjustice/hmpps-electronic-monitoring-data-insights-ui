import hmppsConfig from '@ministryofjustice/eslint-config-hmpps'

export default hmppsConfig({
  extraPathsAllowingDevDependencies: [
    '.allowed-scripts.mjs',
    'jest.setup.ts',
    'playwright_tests/**/*',
    'playwright.config.ts',
  ],
})
