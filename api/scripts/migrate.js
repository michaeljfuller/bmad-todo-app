'use strict'

const { openSqlite, applyMigrations } = require('../db/index.js')

const sqlite = openSqlite()
try {
  applyMigrations(sqlite)
} finally {
  sqlite.close()
}
