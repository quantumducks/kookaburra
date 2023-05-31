'use strict'

const clone = require('clone-deep')
const { generate } = require('randomstring')
const { random } = require('@toa.io/generic')
const { Locator } = require('@toa.io/core')

const fixtures = require('./uris.fixtures')
const { uris } = require('../')

const gen = () => 'schema://host-' + generate().toLowerCase() + ':' + (random(1000) + 1000)

describe('construct', () => {
  const construct = uris.construct

  let annotations

  beforeEach(() => {
    annotations = clone(fixtures.annotations)
  })

  it('should be', () => {
    expect(construct).toBeDefined()
    expect(construct).toBeInstanceOf(Function)
  })

  describe('normalize', () => {
    it('should treat string value as default', () => {
      const declaration = gen()
      const result = construct(declaration)

      expect(result).toStrictEqual({ default: declaration })
    })

    it('should allow dot notation', () => {
      const url = gen()

      annotations['foo.bar'] = url

      construct(annotations)

      expect(annotations['foo.bar']).toStrictEqual(url)
    })

    it('should allow shards', () => {
      const annotations = 'schema://host{1-2}-' + generate().toLowerCase()

      construct(annotations)

      expect(annotations).toStrictEqual(annotations)
    })

    it('should allow dot notation with namespace value', () => {
      annotations.foo = gen()
      annotations['foo.bar'] = gen()

      expect(() => construct(annotations)).not.toThrow()
    })
  })

  describe('validate', () => {
    it('should throw if declaration is not a string or an object', () => {
      // noinspection JSCheckFunctionSignatures
      expect(() => construct(1)).toThrow(TypeError)
      expect(() => construct(null)).toThrow(TypeError)
    })
  })
})

describe('resolve', () => {
  const resolve = uris.resolve

  let name
  let namespace
  let uri

  /** @type {toa.pointer.URIs} */
  let annotation

  /** @type {toa.core.Locator} */
  let locator

  beforeEach(() => {
    name = generate()
    namespace = generate()
    uri = gen()

    annotation = {
      [namespace + '.' + name]: uri
    }

    locator = new Locator(name, namespace)
  })

  it('should be', () => {
    expect(uris.resolve).toBeDefined()
    expect(uris.resolve).toBeInstanceOf(Function)
  })

  it('should resolve by id', () => {
    const { url } = resolve(locator, annotation)

    expect(url).toBeInstanceOf(URL)
    expect(url.href).toStrictEqual(uri)
  })

  it('should throw if not found', () => {
    const name = generate()
    const namespace = generate()
    const locator = new Locator(name, namespace)

    expect(() => resolve(locator, annotation)).toThrow(`URI annotation for '${locator.id}' is not found`)
  })

  it('should resolve by namespace', () => {
    annotation[namespace] = uri

    const { url } = resolve(locator, annotation)

    expect(url.href).toStrictEqual(uri)
  })

  it('should resolve default', () => {
    annotation = { default: gen() }

    const { url } = resolve(locator, annotation)

    expect(url.href).toStrictEqual(annotation.default)
  })

  it('should resolve global locators', () => {
    const name = generate()
    const locator = new Locator(name)
    const uri = gen()

    annotation = { [name]: uri }

    const { url } = resolve(locator, annotation)

    expect(url.href).toStrictEqual(uri)
  })
})

it('should expose validate function', async () => {
  expect(uris.validate).toBeInstanceOf(Function)
})
