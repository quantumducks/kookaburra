'use strict'

const boot = require('@toa.io/boot')

const { components: find } = require('../util/find')

async function compose (argv) {
  const paths = find(argv.paths)
  const composition = await boot.composition(paths, argv)

  await composition.connect()

  if (argv.kill === true) await composition.disconnect()
}

exports.compose = compose
