'use strict'

const { normalize, validate } = require('./.construct')

/** @type {toa.annotations.uris.Constructor} */
const construct = (declaration) => {
  const normalized = normalize(declaration)

  validate(normalized)

  return normalized
}

exports.construct = construct
