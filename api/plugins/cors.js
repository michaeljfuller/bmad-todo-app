'use strict'

const fp = require('fastify-plugin')

/**
 * CORS from `CORS_ORIGIN` only — no `*` default (project-context / Story 2.4).
 */
module.exports = fp(async function corsEnvPlugin(fastify, _opts) {
  const raw = process.env.CORS_ORIGIN
  if (raw === undefined || raw === null || String(raw).trim() === '') {
    return
  }

  await fastify.register(require('@fastify/cors'), {
    origin: String(raw).trim(),
  })
})
