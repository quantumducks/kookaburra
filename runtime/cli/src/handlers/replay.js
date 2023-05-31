'use strict'

const { pick } = require('@toa.io/generic')
const { context, components } = require('@toa.io/userland/samples')

const find = require('../util/find')
const docker = require('./docker')

/**
 * @param {Record<string, string | string[] | boolean>} argv
 * @return {Promise<void>}
 */
async function replay (argv) {
  if (argv.dock) return dock(argv)

  /** @type {boolean} */
  let ok

  const paths = find.components(argv.paths, true)

  /** @type {toa.samples.suite.Options} */
  const options = {
    component: argv.component,
    autonomous: argv.autonomous,
    integration: argv.integration,
    operation: argv.operation,
    title: argv.title,
    runner: { bail: true }
  }

  if (paths !== null) {
    ok = await components(paths, options)
  } else {
    // no components found, checking context
    const path = find.context(argv.paths[0], true)

    if (path === null) throw new Error('Neither components nor context found in ' + argv.paths.join(','))

    ok = await context(path, options)
  }

  const message = (ok ? GREEN + 'PASSED' : RED + 'FAILED') + RESET

  // print after tap's output
  process.on('beforeExit', () => console.log(message))
}

/**
 * @param {Record<string, string | string[] | boolean>} argv
 * @return {Promise<void>}
 */
async function dock (argv) {
  const repository = await docker.build(argv.paths)
  const args = pick(argv, ['component', 'operation', 'integration', 'title'])
  const command = docker.command('toa replay *', args)

  await docker.run(repository, command)
}

const GREEN = '\x1b[32m'
const RED = '\x1b[31m'
const RESET = '\x1b[0m'

exports.replay = replay
