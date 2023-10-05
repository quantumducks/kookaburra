'use strict'

const boot = require('@toa.io/boot')
const { shortcuts } = require('@toa.io/norm')
const { directory: { find } } = require('@toa.io/filesystem')
const { version } = require('@toa.io/runtime')

const serve = async (argv) => {
  console.log('Runtime', version)

  argv.path = shortcuts.resolve(argv.path)

  const module = find(argv.path, process.cwd())

  const { Factory } = require(module)

  const factory = new Factory(boot)

  if (factory.service === undefined) throw new Error(`Service is not implemented by ${argv.path}`)

  const service = factory.service()

  await service.connect()

  // for tests
  return service
}

exports.serve = serve
