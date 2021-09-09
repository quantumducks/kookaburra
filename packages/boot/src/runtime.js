'use strict'

const { load } = require('@kookaburra/package')
const { Runtime } = require('@kookaburra/runtime')

const boot = require('./index')

const runtime = async (path) => {
  const manifest = await load(path)
  const locator = boot.locator(manifest)
  const storage = boot.storage(manifest.entity.storage, locator)
  const context = boot.context(manifest)

  const operations = Object.fromEntries(manifest.operations.map((descriptor) => {
    const operation = boot.operation(manifest, locator, descriptor, storage, context)

    return [descriptor.name, operation]
  }))

  const runtime = new Runtime(locator, operations)

  if (storage) runtime.depends(storage)
  if (context) runtime.depends(context)

  return runtime
}

exports.runtime = runtime
