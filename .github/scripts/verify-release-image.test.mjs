import assert from 'node:assert/strict'
import test from 'node:test'

import { imageRevision, verifyImageRevision } from './verify-release-image.mjs'

test('reads the source revision from image environment metadata', () => {
  assert.equal(imageRevision(JSON.stringify(['NODE_ENV=production', 'GIT_REF=abc123'])), 'abc123')
})

test('accepts an image built from the expected revision', () => {
  assert.doesNotThrow(() => verifyImageRevision(JSON.stringify(['GIT_REF=abc123']), 'abc123'))
})

test('rejects an image built from another revision', () => {
  assert.throws(
    () => verifyImageRevision(JSON.stringify(['GIT_REF=old456']), 'abc123'),
    /built from old456, not abc123/,
  )
})

test('rejects missing or ambiguous revision metadata', () => {
  assert.throws(() => imageRevision(JSON.stringify(['NODE_ENV=production'])), /exactly one GIT_REF/)
  assert.throws(() => imageRevision(JSON.stringify(['GIT_REF=one', 'GIT_REF=two'])), /exactly one GIT_REF/)
})

test('rejects invalid image metadata', () => {
  assert.throws(() => imageRevision('not JSON'), /invalid configuration metadata/)
  assert.throws(() => imageRevision(JSON.stringify({ GIT_REF: 'abc123' })), /does not contain environment metadata/)
})
