'use strict'

const { test } = require('node:test')
const assert = require('node:assert/strict')
const { build } = require('../helper.js')

test('OPTIONS /todos preflight succeeds when Origin matches CORS_ORIGIN', async (t) => {
  const prevCors = process.env.CORS_ORIGIN
  process.env.CORS_ORIGIN = 'http://localhost:5173'
  t.after(() => {
    process.env.CORS_ORIGIN = prevCors
  })

  const app = await build(t)
  const res = await app.inject({
    method: 'OPTIONS',
    url: '/todos',
    headers: {
      origin: 'http://localhost:5173',
      'access-control-request-method': 'GET',
    },
  })

  assert.ok([200, 204].includes(res.statusCode), `unexpected preflight status ${res.statusCode}`)
  assert.equal(res.headers['access-control-allow-origin'], 'http://localhost:5173')
})
