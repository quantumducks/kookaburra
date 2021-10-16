'use strict'

const clone = require('clone-deep')

const gears = jest.requireActual('@toa.io/gears')
const fixtures = require('./collapse.fixtures')
const mock = fixtures.mock

mock.merge = gears.merge

jest.mock('@toa.io/gears', () => ({ find: mock.find, lookup: mock.lookup, merge: mock.merge }))

const { collapse } = require('../src/collapse')

let samples

beforeEach(() => {
  samples = clone(fixtures.samples)
})

it('should ignore locator', () => {
  const source = {}
  const prototype = { domain: 'foo1', name: 'bar1' }
  const manifest = clone(source)

  collapse(manifest, prototype)

  expect(manifest).toStrictEqual(source)
})

it('should remove prototype property', () => {
  const manifest = { prototype: 'a' }

  collapse(manifest, {})

  expect(manifest).toStrictEqual({})
})

describe('entity', () => {
  it('should ignore storage', () => {
    const source = { entity: { storage: 'foo' } }
    const prototype = { entity: { storage: 'bar' } }
    const manifest = clone(source)

    collapse(manifest, prototype)
    expect(manifest).toStrictEqual(source)

    delete manifest.entity.storage
    collapse(manifest, prototype)
    expect(manifest).toStrictEqual({ entity: {} })
  })

  it('should merge entity schema', () => {
    const manifest = clone(samples.entity.manifest)

    collapse(manifest, samples.entity.prototype)
    expect(manifest).toStrictEqual(samples.entity.result)
  })
})

it('should ignore bindings', () => {
  const source = { bindings: ['foo'] }
  const prototype = { bindings: ['bar'] }
  const manifest = clone(source)

  collapse(manifest, prototype)
  expect(manifest).toStrictEqual(source)

  delete manifest.bindings
  collapse(manifest, prototype)
  expect(manifest).toStrictEqual({})
})

it('should merge operations', () => {
  const manifest = clone(samples.operations.manifest)
  const prototype = clone(samples.operations.prototype)

  collapse(manifest, prototype, '/somewhere')
  expect(manifest).toStrictEqual(samples.operations.result)
})

it('should merge remotes', () => {
  const manifest = clone(samples.remotes.manifest)
  const prototype = clone(samples.remotes.prototype)

  collapse(manifest, prototype, '/somewhere')
  expect(manifest).toStrictEqual(samples.remotes.result)
})
