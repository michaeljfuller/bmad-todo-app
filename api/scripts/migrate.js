'use strict'

const fs = require('node:fs')
const path = require('node:path')

const envPath = path.join(__dirname, '..', '.env')
if (fs.existsSync(envPath)) {
  require('dotenv').config({ path: envPath })
}

const { openSqlite, applyMigrations } = require('../db/index.js')

const sqlite = openSqlite()
try {
  applyMigrations(sqlite)
} finally {
  sqlite.close()
}
