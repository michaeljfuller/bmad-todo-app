'use strict'

const fs = require('node:fs')
const path = require('node:path')
const assert = require('node:assert')
const { test } = require('node:test')

const composePath = path.join(__dirname, '..', 'docker-compose.yml')

test('docker-compose.yml satisfies Story 4.3 stack contract', () => {
  const yml = fs.readFileSync(composePath, 'utf8')

  assert.match(yml, /^\s*api:\s*$/m, 'api service')
  assert.match(yml, /^\s*web:\s*$/m, 'web service')
  assert.match(yml, /docker\/api\.Dockerfile/, 'API Dockerfile path')
  assert.match(yml, /docker\/web\.Dockerfile/, 'web Dockerfile path')
  assert.match(yml, /DATABASE_PATH:\s*\/data\/todos\.db/, 'SQLite path on volume')
  assert.match(yml, /sqlite_data:/, 'named volume for SQLite')
  assert.match(yml, /service_healthy/, 'web waits for healthy api')
  assert.match(yml, /\/ready/, 'readiness probe uses /ready')
  assert.match(yml, /CORS_ORIGIN/, 'CORS from env')
  assert.match(yml, /VITE_API_BASE_URL/, 'Vite API URL build arg')
  assert.match(yml, /app_net/, 'bridge network app_net')
  assert.match(yml, /driver:\s*bridge/, 'explicit bridge driver')
})
