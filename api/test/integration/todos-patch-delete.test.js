'use strict'

const { test } = require('node:test')
const assert = require('node:assert/strict')
const { build } = require('../helper.js')

test('POST then PATCH toggles completed and advances updatedAt', async (t) => {
  const app = await build(t)

  const createRes = await app.inject({
    method: 'POST',
    url: '/todos',
    headers: { 'content-type': 'application/json' },
    payload: { text: 'Toggle me' },
  })
  assert.equal(createRes.statusCode, 201)
  const created = JSON.parse(createRes.payload)
  const beforePatch = new Date(created.updatedAt).getTime()

  await new Promise((r) => setTimeout(r, 5))

  const patchRes = await app.inject({
    method: 'PATCH',
    url: `/todos/${created.id}`,
    headers: { 'content-type': 'application/json' },
    payload: { completed: true },
  })
  assert.equal(patchRes.statusCode, 200)
  const patched = JSON.parse(patchRes.payload)
  assert.equal(patched.id, created.id)
  assert.equal(patched.text, 'Toggle me')
  assert.equal(patched.completed, true)
  assert.equal(patched.createdAt, created.createdAt)
  const afterPatch = new Date(patched.updatedAt).getTime()
  assert.ok(afterPatch > beforePatch, 'updatedAt should strictly increase after PATCH')

  const listRes = await app.inject({ method: 'GET', url: '/todos' })
  assert.equal(listRes.statusCode, 200)
  const list = JSON.parse(listRes.payload)
  assert.equal(list.todos.length, 1)
  assert.deepEqual(list.todos[0], patched)
})

test('PATCH missing id returns 404 with error envelope', async (t) => {
  const app = await build(t)

  const res = await app.inject({
    method: 'PATCH',
    url: '/todos/99999',
    headers: { 'content-type': 'application/json' },
    payload: { completed: true },
  })
  assert.equal(res.statusCode, 404)
  const body = JSON.parse(res.payload)
  assert.equal(body.error.code, 'TODO_NOT_FOUND')
  assert.equal(typeof body.error.message, 'string')
})

test('PATCH invalid id shape returns 404 (same as missing)', async (t) => {
  const app = await build(t)

  const res = await app.inject({
    method: 'PATCH',
    url: '/todos/not-an-id',
    headers: { 'content-type': 'application/json' },
    payload: { completed: true },
  })
  assert.equal(res.statusCode, 404)
  const body = JSON.parse(res.payload)
  assert.equal(body.error.code, 'TODO_NOT_FOUND')
})

test('PATCH invalid body returns 400 with validation envelope', async (t) => {
  const app = await build(t)

  const createRes = await app.inject({
    method: 'POST',
    url: '/todos',
    headers: { 'content-type': 'application/json' },
    payload: { text: 'x' },
  })
  assert.equal(createRes.statusCode, 201)
  const created = JSON.parse(createRes.payload)

  const res = await app.inject({
    method: 'PATCH',
    url: `/todos/${created.id}`,
    headers: { 'content-type': 'application/json' },
    payload: { completed: 'yes' },
  })
  assert.equal(res.statusCode, 400)
  const body = JSON.parse(res.payload)
  assert.equal(body.error.code, 'VALIDATION_ERROR')
})

test('PATCH with extra properties returns 400', async (t) => {
  const app = await build(t)

  const createRes = await app.inject({
    method: 'POST',
    url: '/todos',
    headers: { 'content-type': 'application/json' },
    payload: { text: 'x' },
  })
  const created = JSON.parse(createRes.payload)

  const res = await app.inject({
    method: 'PATCH',
    url: `/todos/${created.id}`,
    headers: { 'content-type': 'application/json' },
    payload: { completed: true, text: 'nope' },
  })
  assert.equal(res.statusCode, 400)
  const body = JSON.parse(res.payload)
  assert.equal(body.error.code, 'VALIDATION_ERROR')
})

test('DELETE existing todo returns 204 empty body and removes row', async (t) => {
  const app = await build(t)

  const createRes = await app.inject({
    method: 'POST',
    url: '/todos',
    headers: { 'content-type': 'application/json' },
    payload: { text: 'Remove me' },
  })
  const created = JSON.parse(createRes.payload)

  const delRes = await app.inject({
    method: 'DELETE',
    url: `/todos/${created.id}`,
  })
  assert.equal(delRes.statusCode, 204)
  assert.equal(delRes.payload, '')

  const listRes = await app.inject({ method: 'GET', url: '/todos' })
  assert.equal(listRes.statusCode, 200)
  const list = JSON.parse(listRes.payload)
  assert.deepEqual(list, { todos: [] })
})

test('DELETE missing id returns 404 with error envelope', async (t) => {
  const app = await build(t)

  const res = await app.inject({ method: 'DELETE', url: '/todos/42' })
  assert.equal(res.statusCode, 404)
  const body = JSON.parse(res.payload)
  assert.equal(body.error.code, 'TODO_NOT_FOUND')
})

test('DELETE invalid id shape returns 404 (same as missing)', async (t) => {
  const app = await build(t)

  const res = await app.inject({ method: 'DELETE', url: '/todos/bad' })
  assert.equal(res.statusCode, 404)
  const body = JSON.parse(res.payload)
  assert.equal(body.error.code, 'TODO_NOT_FOUND')
})

test('PATCH then uncomplete sets completed false', async (t) => {
  const app = await build(t)

  const createRes = await app.inject({
    method: 'POST',
    url: '/todos',
    headers: { 'content-type': 'application/json' },
    payload: { text: 'Reopen' },
  })
  const created = JSON.parse(createRes.payload)

  await app.inject({
    method: 'PATCH',
    url: `/todos/${created.id}`,
    headers: { 'content-type': 'application/json' },
    payload: { completed: true },
  })

  const patchRes = await app.inject({
    method: 'PATCH',
    url: `/todos/${created.id}`,
    headers: { 'content-type': 'application/json' },
    payload: { completed: false },
  })
  assert.equal(patchRes.statusCode, 200)
  const body = JSON.parse(patchRes.payload)
  assert.equal(body.completed, false)
})
