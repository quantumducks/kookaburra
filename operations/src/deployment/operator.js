'use strict'

const workspace = require('./workspace')

/**
 * @implements {toa.deployment.Operator}
 */
class Operator {
  /** @type {toa.deployment.Deployment} */
  #deployment

  /** @type {toa.deployment.Registry} */
  #registry

  /**
   * @param deployment {toa.deployment.Deployment}
   * @param registry {toa.deployment.Registry}
   */
  constructor (deployment, registry) {
    this.#deployment = deployment
    this.#registry = registry
  }

  async export (path) {
    const target = await workspace.create('deployment', path)

    await this.#deployment.export(target)

    return target
  }

  async prepare (path) {
    return await this.#registry.prepare(path)
  }

  async push () {
    await this.#registry.push()
  }

  async install (options = {}) {
    options = Object.assign({}, OPTIONS, options)

    await Promise.all([this.export(), this.push()])
    await this.#deployment.install(options)
  }

  async template (options = {}) {
    await this.export()

    return await this.#deployment.template(options)
  }

  variables () {
    return this.#deployment.variables()
  }

  listVariables () {
    const used = new Set()
    const list = []

    for (const variables of Object.values(this.#deployment.variables())) {
      for (const variable of variables) {
        if (used.has(variable.name)) continue

        list.push(variable)
        used.add(variable.name)
      }
    }

    return list
  }
}

/** @type {toa.deployment.installation.Options} */
const OPTIONS = { wait: false }

exports.Operator = Operator
