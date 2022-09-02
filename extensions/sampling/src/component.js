'use strict'

const { Connector } = require('@toa.io/core')
const { validate, verify } = require('./schema')

/**
 * @implements {toa.core.Component}
 */
class Component extends Connector {
  /** @type {toa.core.Locator} */
  locator

  /** @type {toa.core.Component} */
  #component

  /**
   * @param {toa.core.Component} component
   */
  constructor (component) {
    super()

    this.locator = component.locator
    this.#component = component

    this.depends(component)
  }

  async invoke (endpoint, request) {
    if (request.sample === undefined) return this.#component.invoke(endpoint, request)

    const { sample, ...rest } = request
    const invalid = validate(sample)

    if (invalid !== undefined) return { exception: invalid }

    const reply = await this.#component.invoke(endpoint, rest)

    const mismatch = verify(sample, reply)

    if (mismatch !== null) return { exception: mismatch }

    return reply
  }
}

exports.Component = Component
