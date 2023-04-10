'use strict'

const { generate } = require('randomstring')
const { Locator } = require('@toa.io/core')
const { encode } = require('@toa.io/generic')

const { Pointer } = require('../src/pointer')

it('should be', () => undefined)

/** @type {toa.core.Locator} */
let locator

/** @type {toa..Pointer} */
let pointer

const uris = { default: 'mongodb://whatever' }
const value = encode(uris)

process.env.TOA_STORAGES_MONGODB_POINTER = value

beforeEach(() => {
  const name = generate()
  const namespace = generate()

  locator = new Locator(name, namespace)
  pointer = new Pointer(locator)
})

it('should define schema', () => {
  expect(pointer.protocol).toStrictEqual('mongodb:')
})

it('should expose db', () => {
  expect(pointer.db).toStrictEqual(locator.namespace)
})

it('should expose collection', () => {
  expect(pointer.collection).toStrictEqual(locator.name)
})

it('should define schema on local environment', () => {
  process.env.TOA_DEV = '1'

  expect(() => (pointer = new Pointer(locator))).not.toThrow()

  expect(pointer.protocol).toStrictEqual('mongodb:')

  delete process.env.TOA_DEV
})
