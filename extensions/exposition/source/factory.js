'use strict'

const { Locator } = require('@toa.io/core')
const { remap } = require('@toa.io/generic')

const { Tenant } = require('./tenant')
const { Exposition } = require('./exposition')
const { Server } = require('./server')
const { Remote } = require('./remote')
const { Tree } = require('./tree')
const { Query, constraints } = require('./query')

/**
 * @implements {toa.core.extensions.Factory}
 */
class Factory {
  #boot

  /** @type {toa.extensions.exposition.Server} */
  #server

  constructor (boot) {
    this.#boot = boot
    this.#server = new Server()
  }

  tenant (locator, declaration) {
    const broadcast = this.#boot.bindings.broadcast(BINDING, NAME, locator.id)

    return new Tenant(broadcast, locator, declaration)
  }

  service (name) {
    if (name === undefined || name === 'default' || name === 'resources') return this.#expose()
  }

  #expose () {
    const broadcast = this.#boot.bindings.broadcast(BINDING, NAME)
    const connect = this.#connect.bind(this)
    const exposition = new Exposition(broadcast, connect)

    exposition.depends(this.#server)

    return exposition
  }

  /**
   * @param {string} namespace
   * @param {string} name
   * @returns {Promise<toa.extensions.exposition.Remote>}
   */
  async #connect (namespace, name) {
    const locator = new Locator(name, namespace)
    const remote = await this.#boot.remote(locator)
    const query = this.#query.bind(this)
    const tree = new Tree(query)

    return new Remote(this.#server, remote, tree)
  }

  /**
   * @param {toa.extensions.exposition.declarations.Node | any} node
   * @returns {toa.extensions.exposition.Query}
   */
  #query (node) {
    const query = Query.merge(node)
    const properties = remap(query, (value, key) => new constraints[key](value))

    return new Query(properties)
  }
}

const BINDING = '@toa.io/bindings.amqp'
const NAME = 'exposition'

exports.Factory = Factory
