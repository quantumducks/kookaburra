'use strict'

const path = require('node:path')
const glob = require('fast-glob')

const { load: yaml } = require('@toa.io/libraries.yaml')
const { Locator } = require('@toa.io/core')

const { expand, merge, validate, collapse, dereference, defaults, normalize } = require('./.component')
const { resolve } = require('./lookup')

const component = async (reference) => {
  const manifest = await load(reference)

  normalize(manifest, process.env.TOA_ENV)
  validate(manifest)

  return manifest
}

const load = async (root) => {
  root = resolve(root, undefined, MANIFEST)

  const file = path.resolve(root, MANIFEST)
  const manifest = await yaml(file)

  manifest.path = root
  manifest.locator = new Locator(manifest)

  defaults(manifest)
  expand(manifest)

  await merge(root, manifest)

  if (manifest.prototype !== null) {
    const path = resolve(manifest.prototype, root, MANIFEST)
    const prototype = await load(path)

    collapse(manifest, prototype)
  }

  dereference(manifest)

  return manifest
}

const find = async (pattern) => {
  const paths = await glob(pattern, { onlyDirectories: true, absolute: true })

  return await Promise.all(paths.map(component))
}

const MANIFEST = 'manifest.toa.yaml'

exports.component = component
exports.find = find
