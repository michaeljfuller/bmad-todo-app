'use strict'

const { test } = require('node:test')
const assert = require('node:assert/strict')
const { build } = require('../helper.js')

test('GET /documentation/json exposes /todos contract, methods, 204 DELETE, error envelope', async (t) => {
  const prev = process.env.NODE_ENV
  process.env.NODE_ENV = 'test'
  t.after(() => {
    process.env.NODE_ENV = prev
  })

  const app = await build(t)
  const res = await app.inject({ method: 'GET', url: '/documentation/json' })
  assert.equal(res.statusCode, 200)
  const doc = JSON.parse(res.payload)

  const root = doc.paths['/todos'] ?? doc.paths['/todos/']
  assert.ok(root, 'OpenAPI must document GET/POST /todos (Fastify may emit trailing slash)')
  assert.ok(root.get, 'GET /todos')
  assert.ok(root.post, 'POST /todos')

  const byId = doc.paths['/todos/{id}']
  assert.ok(byId, 'OpenAPI must document /todos/{id}')
  assert.ok(byId.patch, 'PATCH /todos/:id')
  assert.ok(byId.delete, 'DELETE /todos/:id')

  const del204 = byId.delete.responses['204'] ?? byId.delete.responses[204]
  assert.ok(del204, 'DELETE must document 204 No Content')

  const schemas = doc.components?.schemas ?? {}
  const hasErrorEnvelope = Object.values(schemas).some(
    (s) =>
      s &&
      typeof s === 'object' &&
      s.properties?.error &&
      Array.isArray(s.required) &&
      s.required.includes('error')
  )
  assert.ok(hasErrorEnvelope, 'OpenAPI must include error envelope schema (error.code, error.message)')
})
