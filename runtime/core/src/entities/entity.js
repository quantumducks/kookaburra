'use strict'

const { difference, newid } = require('@toa.io/generic')
const { EntityContractException } = require('../exceptions')

class Entity {
  deleted = false
  #schema
  #origin = null
  #state

  constructor (schema, argument) {
    this.#schema = schema

    if (typeof argument === 'object') {
      const object = structuredClone(argument)
      this.#set(object)
      this.#origin = argument
    } else {
      const id = argument === undefined ? newid() : argument
      this.#init(id)
    }
  }

  get () {
    return this.#state
  }

  set (value, optional = false) {
    const error = optional ? this.#schema.fitOptional(value) : this.#schema.fit(value)

    if (error !== null)
      throw new EntityContractException(error, value)

    this.#set(value)
  }

  event (input = undefined) {
    return {
      origin: this.#origin,
      state: this.#state,
      changeset: this.#origin === null ? this.#state : difference(this.#origin, this.#state),
      trailers: this.#state._trailers,
      input
    }
  }

  #init (id) {
    const value = { id, _version: 0 }

    this.set(value, true)
  }

  #set (value) {
    if (!('_trailers' in value))
      Object.defineProperty(value, '_trailers', {
        writable: false,
        configurable: false,
        enumerable: false,
        value: {}
      })

    if (!('_created' in value)) {
      value._created = Date.now()
      value._updated ??= value._created
    }

    if (value._deleted !== null)
      this.deleted = true

    if (this.#state !== undefined) {
      value._updated = Date.now()
      value._version++
    }

    this.#state = value
  }
}

exports.Entity = Entity
