'use strict'

const clone = require('clone-deep')

const { validate } = require('../../src/.component')
const fixtures = require('./validate.fixtures')

let manifest

beforeEach(() => {
  manifest = clone(fixtures.ok)
})

it('should be ok', () => {
  expect(() => validate(manifest)).not.toThrow()
})

it('should provide error', () => {
  manifest.foo = 'bar'

  expect(() => validate(manifest)).toThrow()
})

it('should not have additional properties', () => {
  manifest.foo = 'bar'

  expect(() => validate(manifest)).toThrow()
})

describe('namespace', () => {
  it('should match token pattern', () => {
    manifest.namespace = '1'
    expect(() => validate(manifest)).toThrow(/must match pattern/)

    manifest.namespace = 'foo_'
    expect(() => validate(manifest)).toThrow(/must match pattern/)

    manifest.namespace = 'foo_bar'
    expect(() => validate(manifest)).toThrow(/must match pattern/)

    manifest.namespace = 'foo-'
    expect(() => validate(manifest)).toThrow(/must match pattern/)

    manifest.namespace = 'foo-bar'
    expect(() => validate(manifest)).toThrow('must match pattern')

    manifest.namespace = 'FooBar12'
    expect(() => validate(manifest)).not.toThrow()
  })

  it('should forbid \'system\' namespace', () => {
    manifest.namespace = 'system'
    expect(() => validate(manifest)).toThrow(/must NOT be valid/)
  })

  it('should set `default` namespace', async () => {
    delete manifest.namespace

    expect(() => validate(manifest)).not.toThrow()
    expect(manifest.namespace).toStrictEqual('default')
  })
})

describe('name', () => {
  it('should be optional', () => {
    delete manifest.name
    expect(() => validate(manifest)).not.toThrow()
  })
})

describe('entity', () => {
  it('should be optional', () => {
    delete manifest.entity
    expect(() => validate(manifest)).not.toThrow()
  })

  it('should be object', () => {
    manifest.entity = 'foo'
    expect(() => validate(manifest)).toThrow(/must be object/)
  })

  it('should not have additional properties', () => {
    manifest.entity.foo = 'bar'
    expect(() => validate(manifest)).toThrow()
  })

  describe('schema', () => {
    it('should be required', () => {
      delete manifest.entity.schema
      expect(() => validate(manifest)).toThrow()
    })

    it('should be JSON schema object', () => {
      manifest.entity.schema = { properties: { foo: 'bar' } }
      expect(() => validate(manifest)).toThrow()
    })

    it('should be JSON schema object of type object', () => {
      manifest.entity.schema = { type: 'integer' }
      expect(() => validate(manifest)).toThrow(/must be equal to constant/)

      manifest.entity.schema = {}
      validate(manifest)
      expect(manifest.entity.schema.type).toBe('object')
    })

    it('should have property names matching token pattern', () => {
      manifest.entity.schema.properties._foo = { type: 'string' }
      expect(() => validate(manifest)).toThrow(/pattern/)
    })

    it('should allow default id', () => {
      manifest.entity.schema.properties.id = {
        type: 'string',
        pattern: '^[a-fA-F0-9]+$'
      }
      expect(() => validate(manifest)).not.toThrow()
    })
  })

  describe('associated', () => {
    it('should provide default', () => {
      expect(() => validate(manifest)).not.toThrow()
      expect(manifest.entity.associated).toBe(false)
    })
  })
})

describe('bindings', () => {
  it('should be array of unique strings', () => {
    manifest.bindings = 'oops'
    expect(() => validate(manifest)).toThrow(/must be array/)

    manifest.bindings = ['oops', 'oops']
    expect(() => validate(manifest)).toThrow(/duplicate items/)

    manifest.bindings = ['oops', {}]
    expect(() => validate(manifest)).toThrow(/must be string/)
  })

  it('should forbid explicit loop', () => {
    manifest.bindings = ['@toa.io/bindings.loop']
    expect(() => validate(manifest)).toThrow(/must NOT be valid/)
  })
})

describe('operations', () => {
  it('should be object', () => {
    manifest.operations.get = 'bar'
    expect(() => validate(manifest)).toThrow(/must be object/)
  })

  it('should not have additional properties', () => {
    manifest.operations.get.foo = 'bar'
    expect(() => validate(manifest)).toThrow()
  })

  it('should have type (transition or observation)', () => {
    delete manifest.operations.get.type
    expect(() => validate(manifest)).toThrow()

    manifest.operations.get.type = 'foo'
    expect(() => validate(manifest)).toThrow(/one of the allowed values/)
  })

  it('should forbid explicit loop', () => {
    manifest.operations.get.bindings = ['@toa.io/bindings.loop']
    expect(() => validate(manifest)).toThrow(/must NOT be valid/)
  })

  it('should forbid query: false for observations', () => {
    manifest.operations.get.query = false
    expect(() => validate(manifest)).toThrow(/must NOT be valid/)
  })

  it.each([
    ['computation', 'compute']
  ])('should set query: false for %s', async (_, operation) => {
    validate(manifest)

    expect(manifest.operations[operation].query).toBe(false)
  })

  describe('scope', () => {
    it('should have scope', () => {
      delete manifest.operations.get.scope
      expect(() => validate(manifest)).toThrow(/required property/)
    })

    it('should allow only entity or set for observations', () => {
      manifest.operations.get.scope = 'changeset'
      expect(() => validate(manifest)).toThrow(/allowed values/)
    })

    it('should allow only entity for transitions', () => {
      manifest.operations.add.scope = 'changeset'
      expect(() => validate(manifest)).toThrow(/allowed values/)

      manifest.operations.add.scope = 'set'
      expect(() => validate(manifest)).toThrow(/allowed values/)
    })

    it('should allow only changeset for assignments', () => {
      manifest.operations.set.scope = 'changeset'
      expect(() => validate(manifest)).not.toThrow()

      manifest.operations.set.scope = 'set'
      expect(() => validate(manifest)).toThrow(/allowed values/)
    })
  })

  describe('concurrency', () => {
    it('should be required for transitions', () => {
      delete manifest.operations.add.concurrency
      expect(() => validate(manifest)).toThrow(/required property/)
    })

    it('should throw for observations, assignments', () => {
      manifest.operations.get.concurrency = 'none'
      expect(() => validate(manifest)).toThrow()
      delete manifest.operations.get.concurrency

      manifest.operations.set.concurrency = 'none'
      expect(() => validate(manifest)).toThrow()
    })
  })

  describe('input, output', () => {
    it('should be schema', () => {
      manifest.operations.get.input = { properties: { foo: 'bar' } }
      expect(() => validate(manifest)).toThrow()

      delete manifest.operations.get.input
      manifest.operations.get.output = { properties: { foo: 'bar' } }
      expect(() => validate(manifest)).toThrow()
    })
  })
})

describe('receivers', () => {
  it('should throw if transition points to undefined operation', () => {
    manifest.receivers['foo.bar.happened'].operation = 'notExists'

    expect(() => validate(manifest)).toThrow(/refers to undefined operation/)
  })

  it('should throw if transition points to observation', () => {
    manifest.receivers['foo.bar.happened'].operation = 'get'

    expect(() => validate(manifest)).toThrow(/of the allowed types/)
  })

  it('should throw if source has a name `context`', async () => {
    manifest.receivers['foo.bar.happened'].source = 'context'

    expect(() => validate(manifest)).toThrow(/must NOT be valid/)
  })
})
