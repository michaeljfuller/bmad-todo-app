'use strict'

const fs = require('node:fs')
const path = require('node:path')
const Database = require('better-sqlite3')
const { drizzle } = require('drizzle-orm/better-sqlite3')
const { migrate } = require('drizzle-orm/better-sqlite3/migrator')
const schema = require('./schema')

function resolveDatabasePath() {
  const p = process.env.DATABASE_PATH
  if (!p) {
    throw new Error('DATABASE_PATH is required (see api/.env.example)')
  }
  const apiRoot = path.join(__dirname, '..')
  return path.isAbsolute(p) ? p : path.join(apiRoot, p)
}

function openSqlite() {
  const dbPath = resolveDatabasePath()
  fs.mkdirSync(path.dirname(dbPath), { recursive: true })
  return new Database(dbPath)
}

function applyMigrations(sqlite) {
  const db = drizzle(sqlite)
  migrate(db, { migrationsFolder: path.join(__dirname, '..', 'migrations') })
}

function createDb() {
  const sqlite = openSqlite()
  const db = drizzle(sqlite, { schema })
  return { sqlite, db }
}

module.exports = {
  schema,
  resolveDatabasePath,
  openSqlite,
  createDb,
  applyMigrations,
}
