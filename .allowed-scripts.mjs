import { configureAllowedScripts } from '@ministryofjustice/hmpps-npm-script-allowlist'

export default configureAllowedScripts({
  allowlist: {
    'node_modules/@parcel/watcher@2.5.1': 'ALLOW',
    'node_modules/cypress@15.17.0': 'ALLOW',
    'node_modules/dtrace-provider@0.8.8': 'ALLOW',
    'node_modules/esbuild@0.28.1': 'ALLOW',
    'node_modules/fsevents@2.3.3': 'ALLOW',
    // required for open telemetry for app insights
    'node_modules/@grpc/proto-loader/node_modules/protobufjs@7.6.4': 'ALLOW',
    'node_modules/playwright/node_modules/fsevents@2.3.2': 'ALLOW',
    'node_modules/unrs-resolver@1.12.2': 'ALLOW',
  },
})
