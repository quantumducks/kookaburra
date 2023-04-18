'use strict'

const { expand } = require('@toa.io/schemas')

const { resolve } = require('../../shortcuts')

function entity (manifest) {
  if (manifest.entity === undefined) return
  if ('schema' in manifest.entity) manifest.entity.schema = expand(manifest.entity.schema)

  manifest.entity.storage = resolve(manifest.entity.storage)
}

exports.entity = entity
