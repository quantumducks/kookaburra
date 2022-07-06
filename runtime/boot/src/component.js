'use strict'

const { component: load } = require('@toa.io/norm')
const { Locator } = require('@toa.io/core')

/**
 * @param {string} path
 * @param {Object} [options]
 * @return {Promise<toa.norm.Component>}
 */
const component = async (path, options) => {
  const manifest = await load(path)

  if (options?.bindings !== undefined) {
    for (const operation of Object.values(manifest.operations)) {
      operation.bindings = options.bindings
    }
  }

  manifest.locator = new Locator(manifest.name, manifest.namespace)

  return manifest
}

exports.component = component
