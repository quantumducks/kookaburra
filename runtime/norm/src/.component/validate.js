'use strict'

const path = require('node:path')

const { load } = require('@toa.io/yaml')
const schemas = require('@toa.io/schemas')

const object = load.sync(path.resolve(__dirname, 'schema.yaml'))
const schema = schemas.schema(object)

const validate = (manifest) => {
  const error = schema.fit(manifest)

  if (error) throw error

  if (manifest.events !== undefined) events(manifest)
  if (manifest.receivers !== undefined) receivers(manifest)
}

const events = (manifest) => {
  for (const [label, event] of Object.entries(manifest.events)) {
    if (require(event.binding).properties.async !== true) {
      throw new Error(`Event '${label}' binding '${event.binding}' is not async`)
    }
  }
}

const receivers = (manifest) => {
  for (const [locator, receiver] of Object.entries(manifest.receivers)) {
    if (manifest.operations?.[receiver.operation] === undefined) {
      throw new Error(`Receiver '${locator}' refers to undefined operation '${receiver.operation}'`)
    }

    if (!TYPES.has(manifest.operations[receiver.operation].type)) {
      throw new Error(`Receiver '${locator}' must refer to an operation of the allowed types: ${Array.from(TYPES).join(', ')}`)
    }
  }
}

const TYPES = new Set(['transition', 'effect', 'unmanaged'])

exports.validate = validate
