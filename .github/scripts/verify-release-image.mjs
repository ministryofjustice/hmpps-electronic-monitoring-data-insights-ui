#!/usr/bin/env node

import { execFileSync } from 'node:child_process'
import { basename } from 'node:path'

const REVISION_PREFIX = 'GIT_REF='
const IMAGE_FORMAT = '{{json .Image.Config.Env}}'

export const imageRevision = imageEnvironment => {
  let environment
  try {
    environment = JSON.parse(imageEnvironment)
  } catch (error) {
    const detail = error instanceof Error ? `: ${error.message}` : ''
    throw new Error(`The release image returned invalid configuration metadata${detail}`)
  }

  if (!Array.isArray(environment)) {
    throw new Error('The release image does not contain environment metadata')
  }

  const revisions = environment
    .filter(value => typeof value === 'string' && value.startsWith(REVISION_PREFIX))
    .map(value => value.slice(REVISION_PREFIX.length))

  if (revisions.length !== 1 || !revisions[0]) {
    throw new Error('The release image does not contain exactly one GIT_REF revision')
  }

  return revisions[0]
}

export const verifyImageRevision = (imageEnvironment, expectedRevision) => {
  const actualRevision = imageRevision(imageEnvironment)
  if (actualRevision !== expectedRevision) {
    throw new Error(`The release image was built from ${actualRevision}, not ${expectedRevision}`)
  }
}

const main = () => {
  const [image, expectedRevision] = process.argv.slice(2)
  if (!image || !expectedRevision) {
    throw new Error('Usage: verify-release-image.mjs IMAGE EXPECTED_REVISION')
  }

  const imageEnvironment = execFileSync(
    'docker',
    ['buildx', 'imagetools', 'inspect', '--format', IMAGE_FORMAT, image],
    {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'inherit'],
    },
  ).trim()

  verifyImageRevision(imageEnvironment, expectedRevision)
  process.stdout.write(`Verified ${image} was built from ${expectedRevision}\n`)
}

if (process.argv[1] && basename(process.argv[1]) === 'verify-release-image.mjs') main()
