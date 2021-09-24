'use strict'

const { Connector } = require('@kookaburra/core')

const { name } = require('./name')

class Consumer extends Connector {
  #channel
  #locator

  constructor (channel, locator) {
    super()

    this.#channel = channel
    this.#locator = locator

    this.depends(channel)
  }

  async request (endpoint, request) {
    const queue = name(this.#locator, endpoint)

    return this.#channel.request(queue, request)
  }
}

exports.Consumer = Consumer
