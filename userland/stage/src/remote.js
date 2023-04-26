'use strict'

const boot = require('@toa.io/boot')
const { Locator } = require('@toa.io/core')

const { state } = require('./state')

/** @type {toa.stage.Remote} */
const remote = async (id) => {
  const segments = id.split('.')

  if (segments.length === 1) segments.unshift('default')

  const [namespace, name] = segments
  const locator = new Locator(name, namespace)
  const remote = await boot.remote(locator)

  await remote.connect()

  state.remotes.push(remote)

  return remote
}

exports.remote = remote
