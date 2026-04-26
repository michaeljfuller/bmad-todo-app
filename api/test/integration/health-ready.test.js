'use strict'

const { test } = require('node:test')
const assert = require('node:assert/strict')
const { build } = require('../helper.js')

test('GET /health returns 200 and does not require DB (no fastify.db access in handler)', async (t) => {
  const app = await build(t)
  const res = await app.inject({ method: 'GET', url: '/health' })
  assert.equal(res.statusCode, 200)
  const body = JSON.parse(res.payload)
  assert.deepEqual(body, { status: 'ok' })
})

test('GET /ready returns 200 when SQLite and todos schema are healthy', async (t) => {
  const app = await build(t)
  const res = await app.inject({ method: 'GET', url: '/ready' })
  assert.equal(res.statusCode, 200)
  const body = JSON.parse(res.payload)
  assert.deepEqual(body, { status: 'ready' })
})

test('GET /ready returns 503 with safe error envelope when persistence probe fails', async (t) => {
  const app = await build(t)
  // Stub fastify.db: select() throws before the probe can run. Simulates broken persistence
  // without deleting the temp DB file (keeps other teardown paths unchanged).
  const originalDb = app.db
  app.db = {
    select() {
      throw new Error('simulated persistence failure')
    },
  }

  const res = await app.inject({ method: 'GET', url: '/ready' })
  app.db = originalDb

  assert.equal(res.statusCode, 503)
  const body = JSON.parse(res.payload)
  assert.equal(body.error.code, 'NOT_READY')
  assert.equal(typeof body.error.message, 'string')
  const raw = JSON.stringify(body)
  assert.doesNotMatch(raw, /DATABASE_PATH/i, 'JSON must not leak env paths')
  assert.doesNotMatch(raw, /simulated persistence failure/i, 'JSON must not echo internal errors')
})
