'use strict'

const { Connector } = require('@kookaburra/runtime')
const { Storage } = require('../src/storage')

it('should inherit runtime.Connector', () => {
  expect(Storage.prototype).toBeInstanceOf(Connector)
})

it('should provide name', () => {
  expect(Storage.name).toBe('Abstract')
})

it('should provide default id implementation', async () => {
  const id = await Storage.id()

  expect(typeof id).toBe('string')
})
