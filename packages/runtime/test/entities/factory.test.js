'use strict'

const fixtures = require('./factory.fixtures')
const mock = fixtures.mock

jest.mock('../../src/entities/entity', () => ({ Entity: mock.Entity }))
jest.mock('../../src/entities/set', () => ({ Set: mock.Set }))

const { Factory } = require('../../src/entities/factory')

let factory

beforeEach(async () => {
  jest.clearAllMocks()

  factory = new Factory(fixtures.schema, fixtures.storage)
})

it('should create blank', () => {
  const blank = factory.blank()

  expect(blank).toBeInstanceOf(mock.Entity)
  expect(blank.constructor).toHaveBeenCalledWith(fixtures.schema, fixtures.storage.id.mock.results[0].value)
})

it('should create instance', () => {
  const entry = factory.create(fixtures.entry)

  expect(entry).toBeInstanceOf(mock.Entity)
  expect(entry.constructor).toHaveBeenCalledWith(fixtures.schema, fixtures.entry)
})

it('should create set', () => {
  const set = factory.set(fixtures.entries)

  expect(set).toBeInstanceOf(mock.Set)

  const entries = fixtures.entries.map((entry, index) => {
    expect(mock.Entity).toHaveBeenNthCalledWith(index + 1, fixtures.schema, entry)

    return mock.Entity.mock.instances[index]
  })

  expect(set.constructor).toHaveBeenCalledWith(entries)
})
