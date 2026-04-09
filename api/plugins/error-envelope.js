'use strict'

const fp = require('fastify-plugin')

/**
 * Normalizes errors to `{ error: { code, message, details? } }` (project-context).
 * Validation failures → 400 + VALIDATION_ERROR; 5xx → generic client message (NFR-S3).
 */
module.exports = fp(async function errorEnvelopePlugin(fastify, _opts) {
  fastify.setErrorHandler((err, request, reply) => {
    if (err.validation) {
      request.log.warn(
        { reqId: request.id, route: request.routeOptions?.url, err },
        'request validation failed'
      )
      return reply.status(400).send({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Request validation failed',
          details: err.validation.map((v) => ({
            instancePath: v.instancePath,
            message: v.message,
            keyword: v.keyword,
            params: v.params,
          })),
        },
      })
    }

    const statusCode = err.statusCode ?? 500
    if (statusCode >= 500) {
      request.log.error(
        { reqId: request.id, route: request.routeOptions?.url, err },
        'unhandled error'
      )
      return reply.status(500).send({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An unexpected error occurred',
        },
      })
    }

    request.log.info(
      { reqId: request.id, route: request.routeOptions?.url, err },
      'request error'
    )
    return reply.status(statusCode).send({
      error: {
        code: err.code && typeof err.code === 'string' ? err.code : 'HTTP_ERROR',
        message: err.message || 'Request failed',
      },
    })
  })
})
