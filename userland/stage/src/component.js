'use strict'

const boot = require('@toa.io/boot')
const { state } = require('./state')
const binding = require.resolve('./binding')

/** @type {toa.stage.Component} */
const component = async (path) => {
  const manifest = await boot.manifest(path, { bindings: [binding] })
  const component = await boot.component(manifest)

  await component.connect()

  state.components.push(component)

  return component
}

exports.component = component
