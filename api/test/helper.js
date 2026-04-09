'use strict'

// This file contains code that we reuse
// between our tests.

const { build: buildApplication } = require('fastify-cli/helper')
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')
const AppPath = path.join(__dirname, '..', 'app.js')

// Fill in this config with all the configurations
// needed for testing the application
function config() {
  return {
    skipOverride: true, // Register our application with fastify-plugin
  }
}

// automatically build and tear down our instance
async function build(t) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'bmad-api-test-'))
  const dbPath = path.join(dir, 'test.db')
  const prevDb = process.env.DATABASE_PATH
  process.env.DATABASE_PATH = dbPath

  const argv = [AppPath]
  const app = await buildApplication(argv, config())

  t.after(async () => {
    await app.close()
    process.env.DATABASE_PATH = prevDb
    fs.rmSync(dir, { recursive: true, force: true })
  })

  return app
}

module.exports = {
  config,
  build,
}
