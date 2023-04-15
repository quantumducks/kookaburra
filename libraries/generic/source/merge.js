'use strict'

const { entries } = require('./entries')

/** @type {toa.generic.Merge} */
const merge = (
  target,
  source,
  options = /** @type {toa.generic.merge.Options} */ {},
  path = /** @type {string[]} */ []
) => {
  if (target === undefined) target = {}
  if (source === undefined) source = {}

  if (typeof target !== typeof source) {
    if (options.overwrite) return source
    else throw new TypeError(`generic/merge: arguments must be of the same type at ${string(path)}`)
  }

  if (source instanceof Array && target instanceof Array) {
    if (options.overwrite === true) {
      target.length = 0
      target.push(...source)
    } else if (options.ignore !== true) target.push(...source)
  } else if (typeof source === 'object' && typeof target === 'object') {
    for (const [name, value] of entries(source)) {
      path.push(name)

      if (source[name] !== undefined) {
        if (target[name] === undefined) target[name] = value
        else if (typeof value === 'object' && value !== null) {
          if (target[name] === undefined) target[name] = {}

          target[name] = merge(target[name], value, options, path)
        } else if (target[name] !== value) {
          if (options.overwrite === true) target[name] = value
          else if (options.ignore !== true) {
            throw new Error(`generic/merge: conflict at ${string(path)} ('${value}', '${target[name]}')`)
          }
        }
      }

      path.pop()
    }
  } else throw new TypeError(`generic/merge: arguments must be objects or arrays at ${string(path)}`)

  return target
}

/** @type {toa.generic.merge.Predefined} */
const overwrite = (target, source) => merge(target, source, { overwrite: true })

/**
 * @type {toa.generic.merge.Predefined}
 */
const add = (target, source) => merge(target, source, { ignore: true })

const string = (path) => '/' + path.join('/')

exports.merge = merge
exports.overwrite = overwrite
exports.add = add
