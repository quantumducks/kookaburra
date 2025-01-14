'use strict'

const { pick } = require('@toa.io/generic')
const boot = require('@toa.io/boot')
const { version } = require('@toa.io/runtime')

const docker = require('./docker')
const { graceful } = require('./lib/graceful')
const { components: find } = require('../util/find')

/**
 * @param {Record<string, string | boolean>} argv
 * @return {Promise<void>}
 */
async function compose (argv) {
  console.log('Runtime', version)

  if (argv.dock === true) return dock(argv)

  const paths = find(argv.paths)
  const composition = await boot.composition(paths, argv)

  graceful(composition)

  await composition.connect()

  if (argv.kill === true) await composition.disconnect()
}

/**
 * @param {Record<string, string | string[] | boolean>} argv
 * @return {Promise<void>}
 */
async function dock (argv) {
  const repository = await docker.build(argv.context, argv.paths)
  const args = pick(argv, ['kill', 'bindings'])
  const command = docker.command('toa compose *', args)

  await docker.run(repository, command, argv.env)
}

exports.compose = compose
