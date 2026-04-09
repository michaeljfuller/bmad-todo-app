'use strict'

/** Aligned with `routes/todos/index.js` validation. */
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

function addTodoContractSchemas(fastify) {
  fastify.addSchema({
    $id: 'Todo',
    type: 'object',
    required: ['id', 'text', 'completed', 'createdAt', 'updatedAt'],
    additionalProperties: false,
    properties: {
      id: { type: 'number' },
      text: { type: 'string' },
      completed: { type: 'boolean' },
      createdAt: { type: 'string', format: 'date-time' },
      updatedAt: { type: 'string', format: 'date-time' },
    },
  })

  fastify.addSchema({
    $id: 'ValidationDetail',
    type: 'object',
    properties: {
      instancePath: { type: 'string' },
      message: { type: 'string' },
      keyword: { type: 'string' },
      params: { type: 'object', additionalProperties: true },
    },
  })

  fastify.addSchema({
    $id: 'ErrorBody',
    type: 'object',
    required: ['code', 'message'],
    properties: {
      code: { type: 'string' },
      message: { type: 'string' },
      details: {
        type: 'array',
        items: { $ref: 'ValidationDetail#' },
      },
    },
  })

  fastify.addSchema({
    $id: 'ErrorEnvelope',
    type: 'object',
    required: ['error'],
    properties: {
      error: { $ref: 'ErrorBody#' },
    },
  })
}

const todoTag = { tags: ['todos'], summary: 'Todos' }

const listGetSchema = {
  ...todoTag,
  description: 'List all todos ordered by createdAt ascending.',
  response: {
    200: {
      description: 'Keyed todo list',
      type: 'object',
      required: ['todos'],
      properties: {
        todos: { type: 'array', items: { $ref: 'Todo#' } },
      },
    },
  },
}

const createPostSchema = {
  ...todoTag,
  description: 'Create a todo with text (1..10000 chars).',
  body: postBodySchema,
  response: {
    201: { $ref: 'Todo#' },
    400: { $ref: 'ErrorEnvelope#' },
  },
}

const patchByIdSchema = {
  ...todoTag,
  description: 'Update completion flag; invalid or unknown id → 404 (same envelope as missing row).',
  params: {
    type: 'object',
    required: ['id'],
    properties: {
      id: {
        type: 'string',
        description: 'Todo id (positive integer string); non-numeric shapes are rejected as not found.',
      },
    },
  },
  body: patchBodySchema,
  response: {
    200: { $ref: 'Todo#' },
    400: { $ref: 'ErrorEnvelope#' },
    404: { $ref: 'ErrorEnvelope#' },
  },
}

const deleteByIdSchema = {
  ...todoTag,
  description: 'Delete a todo by id (204 No Content on success).',
  params: {
    type: 'object',
    required: ['id'],
    properties: {
      id: {
        type: 'string',
        description: 'Todo id (positive integer string); non-numeric shapes → 404.',
      },
    },
  },
  response: {
    204: {
      type: 'null',
    },
    404: { $ref: 'ErrorEnvelope#' },
  },
}

module.exports = {
  MAX_TEXT_LENGTH,
  postBodySchema,
  patchBodySchema,
  addTodoContractSchemas,
  listGetSchema,
  createPostSchema,
  patchByIdSchema,
  deleteByIdSchema,
}
