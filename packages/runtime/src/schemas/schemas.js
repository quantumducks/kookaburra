'use strict'

const path = require('path')

const { default: Ajv } = require('ajv')

const { extensions } = require('./extensions')
const { Schema } = require('./schema')
const { Null } = require('./null')

class Schemas {
  #instance
  #schemas = []
  #map = {}

  constructor () {
    this.#instance = new Ajv({ useDefaults: true })
    this.#extend()
  }

  add (schema, key) {
    if (schema === null) return new Null()

    const instance = new Schema()

    this.#instance.addSchema(schema, key)
    this.#schemas.push({ id: schema.$id, instance })
    this.#map[schema.$id] = this.#map[key] = instance

    return instance
  }

  get = (id) => this.#map[id]

  /**
   * Compiles all schemas. Must be called before any method of Schema instances.
   * This method is required because schemas containing cross-references may be added in any order.
   */
  compile () {
    for (const { id, instance } of this.#schemas) {
      const validate = this.#instance.getSchema(id)

      validate.error = () => validate.errors &&
        this.#instance.errorsText(validate.errors, { dataVar: path.basename(id, '.schema.json') })

      instance.compile(validate)
    }
  }

  #extend () {
    for (const extension of extensions) {
      if (extension.format) this.#instance.addFormat(extension.name, extension.format)
    }
  }
}

exports.Schemas = Schemas
