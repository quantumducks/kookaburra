'use strict'

const { Readable } = require('node:stream')
const { Connector } = require('./connector')
const { Err } = require('error-value')

class Call extends Connector {
  #transmitter
  #contract

  constructor (transmitter, contract) {
    super()

    this.#transmitter = transmitter
    this.#contract = contract

    this.depends(transmitter)
  }

  async invoke (request = {}) {
    request.input ??= null

    this.#contract.fit(request)

    // avoid validation on the recipient's side
    request.authentic = true

    const reply = await this.#transmitter.request(request)

    if (reply === null) return null
    else if (reply instanceof Readable) return reply
    else {
      if (reply.exception !== undefined)
        throw reply.exception

      if (reply.error !== undefined)
        return Err(reply.error.code, reply.error)
      else
        return reply.output
    }
  }

  explain () {
    return this.#contract.discovery
  }
}

exports.Call = Call
