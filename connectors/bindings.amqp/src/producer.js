'use strict'

const { Connector } = require('@kookaburra/core')

const { name } = require('./name')

class Producer extends Connector {
  #channel
  #runtime
  #endpoints

  constructor (channel, runtime, endpoints) {
    super()

    this.#channel = channel
    this.#runtime = runtime
    this.#endpoints = endpoints

    this.depends(channel)
  }

  async connection () {
    return Promise.all(this.#endpoints.map((endpoint) => this.#endpoint(endpoint)))
  }

  async #endpoint (endpoint) {
    const queue = name(this.#runtime.locator, endpoint)

    await this.#channel.reply(queue, async (request) => this.#runtime.invoke(endpoint, request))
  }
}

exports.Producer = Producer
