'use strict'

const { expand } = require('@toa.io/concise')
const { defined } = require('@toa.io/generic')
const { file } = require('@toa.io/filesystem')
const yaml = require('@toa.io/yaml')
const { create, is, ajv } = require('./validator')
const { debug } = require('node:util')
const betterAjvErrors = require('better-ajv-errors').default

class Schema {
  id

  /** @type {import('ajv').ValidateFunction} */
  #validate

  /** @type {import('ajv').ValidateFunction} */
  #validateOptional

  /** @type {import('ajv').ValidateFunction} */
  #match

  /**
   * @param {import('ajv').ValidateFunction} validate
   * @param {import('ajv').ValidateFunction} validateOptional
   */
  constructor (validate, validateOptional, match) {
    this.id = validate.schema.$id
    this.#validate = validate
    this.#validateOptional = validateOptional
    this.#match = match
  }

  fit (value, validate = this.#validate) {
    const valid = validate(value)

    if (valid) return null
    else return this.#error(value)
  }

  fitOptional (value) {
    if (this.#validateOptional === undefined)
      throw new Error('Optional schema is not defined')

    return this.fit(value, this.#validateOptional)
  }

  match (value) {
    if (this.#match() === undefined)
      throw new Error('Matching schema is not defined')

    return this.fit(value, this.#match)
  }

  validate (value, message) {
    const valid = this.#validate(value)

    if (!valid) {
      let error = betterAjvErrors(this.#validate.schema, value, this.#validate.errors, { format: 'js' })

      const text = error.length === 0
        ? this.#validate.errors[0].message
        : error[0].error

      if (message !== undefined)
        message += ': '

      throw new TypeError((message ?? '') + text)
    }
  }

  #error = (value) => {
    const error = this.#validate.errors[0]
    let be = betterAjvErrors(this.#validate.schema, value, this.#validate.errors, { format: 'js' })

    const mapped = {
      message: be[0].error.trim(),
      keyword: error.keyword,
      property: error.propertyName,
      path: error.instancePath,
      schema: error.schemaPath,
      params: error.params
    }

    return defined(mapped)
  }
}

const schema = (cos, options) => {
  if (typeof cos === 'string' && file.is.sync(cos))
    cos = yaml.load.sync(cos)

  const schema = expand(cos, is)
  const validate = create(schema, options)

  let validateOptional
  let match

  if (schema.type === 'object') {
    const { required, ...optional } = schema

    validateOptional = create(optional)
    match = create(optional, { useDefaults: false })
  }

  return new Schema(validate, validateOptional, match)
}

exports.Schema = Schema
exports.schema = schema
