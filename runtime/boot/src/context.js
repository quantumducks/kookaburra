'use strict'

const { Context, Locator } = require('@toa.io/core')

const boot = require('./index')

const context = async (manifest) => {
  const local = await boot.remote(manifest.locator, manifest)
  const extensions = boot.extensions.contexts(manifest)

  const lookup = async (namespace, name) => {
    const locator = new Locator({ namespace, name })
    const remote = await boot.remote(locator)

    await remote.connect()

    return remote
  }

  return new Context(local, lookup, extensions)
}

exports.context = context
