'use strict'

const freeze = require('deep-freeze')

class IO {
  input
  output = {}
  #error

  constructor (input) {
    this.input = { ...input }

    Object.freeze(this)
    Object.seal(this)
  }

  set error (error) {
    if (!(error instanceof Error)) { throw new Error('Error value must be an instance of Error type') }

    if (this.#error) { throw new Error('Error value must be set only once') }

    this.#error = error
  }

  get error () {
    return this.#error
  }

  close () {
    freeze(this.input)
  }
}

exports.IO = IO
