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

test('OPTIONS /todos/:id preflight allows PATCH (todo completion from browser)', async (t) => {
  const prevCors = process.env.CORS_ORIGIN
  process.env.CORS_ORIGIN = 'http://127.0.0.1:5199'
  t.after(() => {
    process.env.CORS_ORIGIN = prevCors
  })

  const app = await build(t)
  const res = await app.inject({
    method: 'OPTIONS',
    url: '/todos/1',
    headers: {
      origin: 'http://127.0.0.1:5199',
      'access-control-request-method': 'PATCH',
      'access-control-request-headers': 'content-type',
    },
  })

  assert.ok([200, 204].includes(res.statusCode), `unexpected preflight status ${res.statusCode}`)
  assert.equal(res.headers['access-control-allow-origin'], 'http://127.0.0.1:5199')
  const allow = res.headers['access-control-allow-methods'] || ''
  assert.match(allow, /\bPATCH\b/i, `expected PATCH in allow-methods, got: ${allow}`)
})

test('OPTIONS /todos/:id preflight allows DELETE', async (t) => {
  const prevCors = process.env.CORS_ORIGIN
  process.env.CORS_ORIGIN = 'http://127.0.0.1:5199'
  t.after(() => {
    process.env.CORS_ORIGIN = prevCors
  })

  const app = await build(t)
  const res = await app.inject({
    method: 'OPTIONS',
    url: '/todos/1',
    headers: {
      origin: 'http://127.0.0.1:5199',
      'access-control-request-method': 'DELETE',
    },
  })

  assert.ok([200, 204].includes(res.statusCode), `unexpected preflight status ${res.statusCode}`)
  const allow = res.headers['access-control-allow-methods'] || ''
  assert.match(allow, /\bDELETE\b/i, `expected DELETE in allow-methods, got: ${allow}`)
})
