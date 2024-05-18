'use strict'

const { default: Ajv } = require('ajv/dist/2019')
const formats = /** @type {(Ajv) => void} */ require('ajv-formats')

const { traverse } = require('@toa.io/generic')

const { options: DEFAULTS } = require('./options')
const { definitions } = require('./definitions')
const { keywords } = require('./keywrods')

const create = (options) => {
  options = Object.assign({}, DEFAULTS, options)

  const validator = new Ajv(options)

  formats(validator)
  keywords(validator)
  definitions(validator)

  return validator
}

/**
 * @implements {toa.schema.Schema}
 */
class Schema {
  /** @type {toa.schema.JSON} */
  schema

  #validator
  #validate
  #defaults
  #match
  #adapt
  #system

  /**
   * @param {any} schema
   * @param {object} [options]
   */
  constructor (schema, options) {
    this.#validator = create(options)
    this.#validate = this.#validator.compile(schema)

    if (schema.properties !== undefined) this.#recompile(schema)

    this.schema = schema
  }

  fit (value) {
    const valid = this.#validate(value)

    if (valid) return null
    else return this.#error()
  }

  validate (value, prefix) {
    const valid = this.#validate(value)

    if (!valid) this.#throw(prefix)
  }

  match (value) {
    const valid = this.#match(value)

    if (valid) return null
    else return this.#error(this.#match.errors)
  }

  adapt (value) {
    const valid = this.#adapt(value)

    if (valid) return null
    else return this.#error(this.#adapt.errors)
  }

  defaults (value = {}) {
    this.#defaults(value)

    return value
  }

  system () {
    const value = {}

    this.#system(value)

    return value
  }

  /**
   * @param {toa.schema.JSON} schema
   */
  #recompile (schema) {
    const { required, $id, ...defaults } = schema
    const system = { ...defaults, properties: {} }

    if ($id !== undefined) {
      defaults.$id = $id + '_defaults'
      system.$id = $id + '_system'
    }

    this.#defaults = this.#validator.compile(defaults)

    for (const [key, value] of Object.entries(schema.properties)) {
      const { ...copy } = value

      delete copy.default

      if (value.system === true) system.properties[key] = copy
    }

    this.#system = this.#validator.compile(system)

    // match
    const match = structuredClone(schema)

    if (match.properties !== undefined) properties(match.properties)

    if ($id !== undefined) match.$id = $id + '_match'

    traverse(match, (node) => {
      const isMeta = typeof node.type === 'object'

      if (node.properties !== undefined && node[PROPERTY] === 1 && !isMeta) properties(node.properties)

      if (node.default !== undefined && node[PROPERTIES] !== 1) delete node.default
    })

    this.#match = this.#validator.compile(match)

    // adapt
    const adaptive = structuredClone(schema)

    if (adaptive.properties !== undefined) properties(adaptive.properties)

    if ($id !== undefined) adaptive.$id = $id + '_similar'

    traverse(adaptive, (node) => {
      const isMeta = typeof node.type === 'object'

      if (node.properties !== undefined && node[PROPERTY] !== 1 && node[PROPERTIES] !== 1 && !isMeta) properties(node.properties)

      if (node.required && node[PROPERTIES] !== 1) delete node.required
      if (node.default !== undefined && node[PROPERTIES] !== 1) delete node.default
    })

    this.#adapt = this.#validator.compile(adaptive)
  }

  /**
   * @returns {toa.schema.Error}
   */
  #error (errors = undefined) {
    if (errors === undefined) errors = this.#validate.errors

    const error = errors[0]

    const result = {
      message: error.message,
      keyword: error.keyword
    }

    if (error.schemaPath) result.schema = error.schemaPath
    if (error.instancePath) result.path = error.instancePath

    if (error.keyword === 'additionalProperties') {
      result.property = error.params.additionalProperty
      result.message = error.instancePath.substring(1) + ' ' +
        result.message.replace('properties', 'property') + ` '${result.property}'`
    } else if (error.keyword === 'enum') {
      result.property = error.instancePath.substring(1)
      result.message += ` (${error.params.allowedValues.join(', ')})`
    } else if (error.instancePath) {
      result.property = error.instancePath.substring(1)
      result.message = result.property + ' ' + result.message

      if (error.keyword === 'const') result.message += ` '${error.params.allowedValue}'`
    } else if (error.keyword === 'required') result.property = error.params.missingProperty

    return result
  }

  /**
   * @throws {TypeError}
   */
  #throw (prefix) {
    const error = this.#error()
    const message = prefix === undefined ? error.message : prefix + ': ' + error.message

    throw new TypeError(message)
  }
}

const properties = (node) => {
  node[PROPERTIES] = 1

  for (const key of Object.keys(node)) node[key][PROPERTY] = 1
}

const PROPERTIES = Symbol('Properties marker')
const PROPERTY = Symbol('Property marker')

exports.Schema = Schema
