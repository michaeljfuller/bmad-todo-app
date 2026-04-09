'use strict'

const path = require('node:path')

/** @type { import('drizzle-kit').Config } */
module.exports = {
  schema: './db/schema.js',
  out: './migrations',
  dialect: 'sqlite',
  dbCredentials: {
    url: process.env.DATABASE_PATH
      ? path.isAbsolute(process.env.DATABASE_PATH)
        ? process.env.DATABASE_PATH
        : path.join(__dirname, process.env.DATABASE_PATH)
      : path.join(__dirname, 'data/todos.db'),
  },
}
