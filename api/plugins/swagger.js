'use strict'

const fp = require('fastify-plugin')
const { addTodoContractSchemas } = require('../schemas/todos-contract')

/**
 * OpenAPI via @fastify/swagger; Swagger UI only when NODE_ENV=development (Architecture).
 * JSON spec at `/documentation/json` for test/CI when UI is not mounted (avoids duplicate route).
 */
module.exports = fp(async function swaggerPlugin(fastify, _opts) {
  if (process.env.NODE_ENV === 'production') {
    return
  }

  await fastify.register(require('@fastify/swagger'), {
    openapi: {
      openapi: '3.1.0',
      info: {
        title: 'Bmad Todo API',
        version: '1.0.0',
        description:
          'Todo REST API under `/todos` (single prefix). Errors: `{ "error": { "code", "message", "details?" } }`.',
      },
      tags: [{ name: 'todos', description: 'Todo CRUD' }],
      servers: [{ url: '/', description: 'Current host' }],
    },
  })

  addTodoContractSchemas(fastify)

  const isDev = process.env.NODE_ENV === 'development'

  if (isDev) {
    await fastify.register(require('@fastify/swagger-ui'), {
      routePrefix: '/documentation',
    })
  } else {
    fastify.get(
      '/documentation/json',
      {
        schema: { hide: true },
      },
      async function openApiJson() {
        return fastify.swagger()
      }
    )
  }
})
