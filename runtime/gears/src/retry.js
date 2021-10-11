'use strict'

const { timeout } = require('./timeout')
const { merge } = require('./merge')

const retry = async (func, options = {}, attempt = 0) => {
  if (options._ === undefined) merge(options, DEFAULTS, { ignore: true })

  let inner

  const outer = await func(async () => {
    if (attempt === options.retries) throw new Error(`Retry failed after ${attempt} attempts`)

    inner = (async () => {
      const interval = Math.min(options.base * Math.pow(options.factor, attempt), options.max)
      const dispersion = interval * options.dispersion * (Math.random() - 0.5)
      await timeout(interval + dispersion)

      return retry(func, options, attempt + 1)
    })()
  }, attempt)

  return inner === undefined ? outer : await inner
}

const DEFAULTS = {
  retries: Infinity,
  factor: 1.5,
  base: 1000,
  max: 30000,
  dispersion: 0.1,
  _: true
}

exports.retry = retry
