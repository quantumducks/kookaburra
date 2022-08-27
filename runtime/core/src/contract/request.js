'use strict'

const clone = require('clone-deep')

const schemas = require('./schemas')
const { RequestContractException } = require('../exceptions')
const { Conditions } = require('./conditions')

class Request extends Conditions {
  static Exception = RequestContractException

  /**
   * @returns {toa.schema.JSON}
   */
  static schema (definition) {
    const schema = { properties: {}, additionalProperties: false }
    const required = []

    if (definition.input) {
      definition.input.additionalProperties = false
      schema.properties.input = definition.input
      required.push('input')
    }

    if (definition.query === true) required.push('query')

    if (definition.query !== false) {
      const query = clone(schemas.query)

      if (definition.type === 'observation') {
        delete query.properties.version
      } else {
        delete query.properties.projection
      }

      if (definition.type !== 'observation' || definition.scope !== 'objects') {
        delete query.properties.omit
        delete query.properties.limit
      } else {
        if (query.required === undefined) query.required = ['limit']
        else query.required.push('limit')
      }

      schema.properties.query = query
    }

    if (required.length > 0) schema.required = required

    return schema
  }
}

exports.Request = Request
