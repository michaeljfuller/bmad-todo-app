'use strict'

const fp = require('fastify-plugin')
const { drizzle } = require('drizzle-orm/better-sqlite3')
const { openSqlite, applyMigrations, schema } = require('../db')

module.exports = fp(async function databasePlugin(fastify, _opts) {
  const sqlite = openSqlite()
  applyMigrations(sqlite)
  const db = drizzle(sqlite, { schema })

  fastify.decorate('db', db)

  fastify.addHook('onClose', async () => {
    sqlite.close()
  })
})
