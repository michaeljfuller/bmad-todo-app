'use strict'

/**
 * Todo REST API (list, create, patch completion, delete).
 *
 * **Prefix:** `/todos` (from `@fastify/autoload` — directory `routes/todos/`).
 * OpenAPI and CORS hardening are Story 2.4.
 */

const { asc, eq } = require('drizzle-orm')
const { todos } = require('../../db/schema')

const MAX_TEXT_LENGTH = 10_000

const postBodySchema = {
  type: 'object',
  required: ['text'],
  additionalProperties: false,
  properties: {
    text: { type: 'string', minLength: 1, maxLength: MAX_TEXT_LENGTH },
  },
}

const patchBodySchema = {
  type: 'object',
  required: ['completed'],
  additionalProperties: false,
  properties: {
    completed: { type: 'boolean' },
  },
}

function todoToJson(row) {
  return {
    id: row.id,
    text: row.text,
    completed: row.completed,
    createdAt: new Date(row.createdAt).toISOString(),
    updatedAt: new Date(row.updatedAt).toISOString(),
  }
}

/** Positive integer id strings only; invalid shape → same 404 as missing row (story 2.3). */
function parseTodoId(raw) {
  if (raw === undefined || raw === null) return null
  const s = String(raw)
  if (!/^\d+$/.test(s)) return null
  const id = Number(s)
  if (!Number.isSafeInteger(id) || id < 1) return null
  return id
}

function todoNotFoundError() {
  const err = new Error('Todo not found')
  err.statusCode = 404
  err.code = 'TODO_NOT_FOUND'
  return err
}

module.exports = async function todosRoutes(fastify, _opts) {
  fastify.get('/', async function listTodos() {
    const rows = await fastify.db
      .select()
      .from(todos)
      .orderBy(asc(todos.createdAt))
    return { todos: rows.map(todoToJson) }
  })

  fastify.post(
    '/',
    {
      schema: {
        body: postBodySchema,
      },
    },
    async function createTodo(request, reply) {
      const { text } = request.body
      const inserted = await fastify.db
        .insert(todos)
        .values({ text, completed: false })
        .returning()

      const row = inserted[0]
      request.log.info(
        { reqId: request.id, todoId: row.id, route: '/todos' },
        'todo created'
      )
      return reply.code(201).send(todoToJson(row))
    }
  )

  fastify.patch(
    '/:id',
    {
      schema: {
        body: patchBodySchema,
      },
    },
    async function patchTodoCompletion(request, reply) {
      const id = parseTodoId(request.params.id)
      if (id === null) {
        throw todoNotFoundError()
      }

      const { completed } = request.body
      const now = Date.now()

      const updated = await fastify.db
        .update(todos)
        .set({ completed, updatedAt: now })
        .where(eq(todos.id, id))
        .returning()

      if (!updated.length) {
        throw todoNotFoundError()
      }

      const row = updated[0]
      request.log.info(
        { reqId: request.id, todoId: row.id, route: '/todos/:id' },
        'todo completion updated'
      )
      return reply.send(todoToJson(row))
    }
  )

  fastify.delete('/:id', async function deleteTodo(request, reply) {
    const id = parseTodoId(request.params.id)
    if (id === null) {
      throw todoNotFoundError()
    }

    const removed = await fastify.db
      .delete(todos)
      .where(eq(todos.id, id))
      .returning()

    if (!removed.length) {
      throw todoNotFoundError()
    }

    request.log.info(
      { reqId: request.id, todoId: id, route: '/todos/:id' },
      'todo deleted'
    )
    return reply.code(204).send()
  })
}
