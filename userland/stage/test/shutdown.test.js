'use strict'

const { generate } = require('randomstring')

const mock = {
  boot: require('./boot.mock'),
  state: require('./state.mock')
}

jest.mock('@toa.io/boot', () => mock.boot)
jest.mock('../src/state', () => mock.state)

const { state } = require('../src/state')
const stage = require('../')

beforeEach(() => {
  jest.clearAllMocks()
})

it('should be', () => {
  expect(stage.shutdown).toBeDefined()
})

it('should disconnect components', async () => {
  const path = generate()
  const component = await stage.component(path)

  await stage.shutdown()

  expect(component.disconnect).toHaveBeenCalled()
})

it('should disconnect compositions', async () => {
  const paths = [generate(), generate()]

  await stage.composition(paths)
  await stage.shutdown()

  const composition = await mock.boot.composition.mock.results[0].value

  expect(composition.disconnect).toHaveBeenCalled()
})

it('should disconnect remotes', async () => {
  const id = generate() + '.' + generate()

  const remote = await stage.remote(id)
  await stage.shutdown()

  expect(remote.disconnect).toHaveBeenCalled()
})

it('should reset state', async () => {
  await stage.shutdown()

  expect(state.reset).toHaveBeenCalled()
})
