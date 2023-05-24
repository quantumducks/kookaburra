'use strict'

// these defaults are required before validation
const defaults = (manifest) => {
  if (manifest.prototype === undefined) manifest.prototype = '@toa.io/prototype'
  if (manifest.bindings === undefined) manifest.bindings = ['@toa.io/bindings.amqp']
  if (manifest.bridge === undefined) manifest.bridge = '@toa.io/bridges.node'

  if (manifest.entity === null || manifest.entity === undefined) manifest.entity = { storage: null }
  if (manifest.entity.storage === undefined) manifest.entity.storage = '@toa.io/storages.mongodb'
  if (manifest.entity.storage === null) manifest.entity.storage = '@toa.io/storages.null'

  // TODO: bridge.version()
  if (manifest.version === undefined) manifest.version = '0.0.0'
}

exports.defaults = defaults
