'use strict'

const { State } = require('../src/state')
const fixtures = require('./state.fixtures')

let state

beforeEach(() => {
  jest.clearAllMocks()

  state = new State(fixtures.storage, fixtures.factory, fixtures.emitter)
})

it('should provide object', async () => {
  const entity = await state.object(fixtures.query)

  expect(fixtures.storage.get).toHaveBeenCalledWith(fixtures.query)
  expect(entity).toStrictEqual(fixtures.factory.object.mock.results[0].value)
  expect(fixtures.factory.object).toHaveBeenCalledWith(fixtures.storage.get.mock.results[0].value)
})

it('should provide objects', async () => {
  const set = await state.objects(fixtures.query)

  expect(fixtures.storage.find).toHaveBeenCalledWith(fixtures.query)
  expect(set).toStrictEqual(fixtures.factory.objects.mock.results[0].value)
  expect(fixtures.factory.objects).toHaveBeenCalledWith(fixtures.storage.find.mock.results[0].value)
})

it('should store entity', async () => {
  await state.commit(fixtures.initial)

  expect(fixtures.storage.store).toHaveBeenCalledWith(fixtures.initial.get.mock.results[0].value)
})

it('should emit', async () => {
  await state.commit(fixtures.entity)

  expect(fixtures.emitter.emit).toHaveBeenCalledWith(fixtures.entity.event.mock.results[0].value)
})
