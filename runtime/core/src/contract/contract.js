'use strict'

const { SystemException } = require('../exceptions')

class Contract {
  schema

  constructor (schema) {
    this.schema = schema
  }

  fit (value) {
    const error = this.schema.fit(value)

    if (error !== null)
      throw new this.constructor.Exception(error, value)
  }

  static Exception = SystemException
}

exports.Contract = Contract
