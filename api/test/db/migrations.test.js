'use strict'

const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')
const { openSqlite, applyMigrations } = require('../../db/index.js')

test('migrations create todos with snake_case columns and create-time timestamps', async (t) => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'bmad-api-db-'))
  const dbPath = path.join(dir, 'test.db')
  const prev = process.env.DATABASE_PATH
  process.env.DATABASE_PATH = dbPath

  const sqlite = openSqlite()
  t.after(() => {
    sqlite.close()
    process.env.DATABASE_PATH = prev
    fs.rmSync(dir, { recursive: true, force: true })
  })

  applyMigrations(sqlite)

  const cols = sqlite.prepare(`PRAGMA table_info('todos')`).all()
  const names = cols.map((c) => c.name).sort()
  assert.deepEqual(names, ['completed', 'created_at', 'id', 'text', 'updated_at'])

  sqlite.prepare('INSERT INTO todos (text) VALUES (?)').run('hello')
  const row = sqlite.prepare('SELECT * FROM todos WHERE id = 1').get()
  assert.equal(row.text, 'hello')
  assert.equal(row.completed, 0)
  assert.equal(typeof row.created_at, 'number')
  assert.equal(row.updated_at, row.created_at)
})
