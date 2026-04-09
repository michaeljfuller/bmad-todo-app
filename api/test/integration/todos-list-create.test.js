'use strict'

const { test } = require('node:test')
const assert = require('node:assert/strict')
const { build } = require('../helper.js')

test('GET /todos returns empty keyed list', async (t) => {
  const app = await build(t)
  const res = await app.inject({ method: 'GET', url: '/todos' })
  assert.equal(res.statusCode, 200)
  const body = JSON.parse(res.payload)
  assert.deepEqual(body, { todos: [] })
})

test('POST valid todo then GET lists persisted row with camelCase and ISO dates', async (t) => {
  const app = await build(t)

  const createRes = await app.inject({
    method: 'POST',
    url: '/todos',
    headers: { 'content-type': 'application/json' },
    payload: { text: 'Buy milk' },
  })
  assert.equal(createRes.statusCode, 201)
  const created = JSON.parse(createRes.payload)
  assert.equal(typeof created.id, 'number')
  assert.equal(created.text, 'Buy milk')
  assert.equal(created.completed, false)
  assert.match(created.createdAt, /^\d{4}-\d{2}-\d{2}T.*Z$/)
  assert.equal(created.updatedAt, created.createdAt)

  const listRes = await app.inject({ method: 'GET', url: '/todos' })
  assert.equal(listRes.statusCode, 200)
  const list = JSON.parse(listRes.payload)
  assert.equal(list.todos.length, 1)
  assert.deepEqual(list.todos[0], created)
})

test('POST invalid body returns 400 with standard error envelope', async (t) => {
  const app = await build(t)

  const res = await app.inject({
    method: 'POST',
    url: '/todos',
    headers: { 'content-type': 'application/json' },
    payload: { text: '' },
  })
  assert.equal(res.statusCode, 400)
  const body = JSON.parse(res.payload)
  assert.equal(body.error.code, 'VALIDATION_ERROR')
  assert.equal(typeof body.error.message, 'string')
  assert.ok(Array.isArray(body.error.details))
})

test('POST missing text returns 400 with error envelope', async (t) => {
  const app = await build(t)
  const res = await app.inject({
    method: 'POST',
    url: '/todos',
    headers: { 'content-type': 'application/json' },
    payload: {},
  })
  assert.equal(res.statusCode, 400)
  const body = JSON.parse(res.payload)
  assert.equal(body.error.code, 'VALIDATION_ERROR')
})

test('POST text over max length returns 400 with error envelope', async (t) => {
  const app = await build(t)
  const res = await app.inject({
    method: 'POST',
    url: '/todos',
    headers: { 'content-type': 'application/json' },
    payload: { text: 'x'.repeat(10_001) },
  })
  assert.equal(res.statusCode, 400)
  const body = JSON.parse(res.payload)
  assert.equal(body.error.code, 'VALIDATION_ERROR')
})
