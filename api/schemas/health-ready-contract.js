'use strict'

const opsTag = { tags: ['ops'], summary: 'Operability' }

const healthGetSchema = {
  ...opsTag,
  description:
    'Liveness probe — process is running and accepting HTTP. Does not check the database.',
  response: {
    200: {
      description: 'Service process is live',
      type: 'object',
      required: ['status'],
      additionalProperties: false,
      properties: {
        status: { type: 'string', enum: ['ok'] },
      },
    },
  },
}

const readyGetSchema = {
  ...opsTag,
  description:
    'Readiness probe — SQLite is reachable and the `todos` table is queryable after migrations.',
  response: {
    200: {
      description: 'Service is ready to serve traffic',
      type: 'object',
      required: ['status'],
      additionalProperties: false,
      properties: {
        status: { type: 'string', enum: ['ready'] },
      },
    },
    503: { $ref: 'ErrorEnvelope#' },
  },
}

module.exports = {
  healthGetSchema,
  readyGetSchema,
}
