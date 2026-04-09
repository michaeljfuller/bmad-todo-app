'use strict'

const { sql } = require('drizzle-orm')
const { integer, sqliteTable, text } = require('drizzle-orm/sqlite-core')

/**
 * SQLite `todos` table — physical columns are snake_case (architecture).
 *
 * - `id`: INTEGER PRIMARY KEY AUTOINCREMENT — stable for REST `/todos/:id` (story 2.2).
 * - `completed`: INTEGER 0/1 in SQLite; Drizzle `{ mode: 'boolean' }`.
 * - `created_at` / `updated_at`: INTEGER Unix epoch **milliseconds**. Both default to the
 *   same value at INSERT via SQL defaults; story 2.2+ maps API JSON to **ISO 8601 UTC strings**.
 *
 * Extension (NFR-SC1): add a nullable `user_id` (or tenant key) + index later without changing
 * core todo semantics — single surrogate PK on `id` keeps per-user indexing straightforward.
 */
const todos = sqliteTable('todos', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  text: text('text').notNull(),
  completed: integer('completed', { mode: 'boolean' }).notNull().default(false),
  createdAt: integer('created_at', { mode: 'number' })
    .notNull()
    .default(sql`(unixepoch() * 1000)`),
  updatedAt: integer('updated_at', { mode: 'number' })
    .notNull()
    .default(sql`(unixepoch() * 1000)`),
})

module.exports = { todos }
