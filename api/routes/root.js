'use strict'

const { todos } = require('../db/schema')
const {
  healthGetSchema,
  readyGetSchema,
} = require('../schemas/health-ready-contract')

module.exports = async function (fastify, _opts) {
  fastify.get('/', async function (_request, _reply) {
    return { root: true }
  })

  fastify.get('/health', { schema: healthGetSchema }, async function health() {
    return { status: 'ok' }
  })

  fastify.get('/ready', { schema: readyGetSchema }, async function ready(
    request,
    reply
  ) {
    try {
      await fastify.db.select().from(todos).limit(1)
      return { status: 'ready' }
    } catch (err) {
      request.log.warn(
        { reqId: request.id, err },
        'readiness probe failed'
      )
      return reply.status(503).send({
        error: {
          code: 'NOT_READY',
          message: 'Service is not ready',
        },
      })
    }
  })
}
