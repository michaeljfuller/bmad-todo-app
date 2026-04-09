'use strict'

/**
 * Todo list/create REST API.
 *
 * **Prefix:** `/todos` (from `@fastify/autoload` — directory `routes/todos/`).
 * OpenAPI and CORS hardening are Story 2.4; PATCH/DELETE are Story 2.3.
 */

const { asc } = require('drizzle-orm')
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

function todoToJson(row) {
  return {
    id: row.id,
    text: row.text,
    completed: row.completed,
    createdAt: new Date(row.createdAt).toISOString(),
    updatedAt: new Date(row.updatedAt).toISOString(),
  }
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
}
