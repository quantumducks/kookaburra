'use strict'

const clone = require('clone-deep')
const { generate } = require('randomstring')
const { expand } = require('../')

const valid = () => true

it('should be', () => {
  expect(expand).toBeDefined()
})

it('should throw on empty array property value', () => {
  const schema = { foo: [] }

  expect(() => expand(schema, valid)).toThrow('Array property declaration must be non-empty')
})

it('should throw if array property items are not of the same type', () => {
  const schema = { foo: [1, 'ok', []] }

  expect(() => expand(schema, valid)).toThrow('Array property items must be of the same type')
})

it('should not expand valid schema', () => {
  const schema = { type: 'number' }
  const output = expand(schema, valid)

  expect(output).toStrictEqual(schema)
})

it('should not expand $ref', async () => {
  const schema = { $ref: 'https://schemas.toa.io/0.0.0/definitions#/definitions/id' }
  const output = expand(schema, valid)

  expect(output).toStrictEqual(schema)
})

it('should expand pattern property oom with empty schema', async () => {
  const schema = { '~+': null }
  const output = expand(schema, valid)

  expect(output).toStrictEqual({
    type: 'object',
    patternProperties: {
      '^.*$': {
        oneOf: [
          {},
          {
            type: 'array',
            items: {}
          }
        ]
      }
    }
  })
})

it('should not expand $id', async () => {
  const schema = { $id: generate(), foo: 'string' }

  const expected = {
    $id: schema.$id,
    type: 'object',
    properties: {
      foo: {
        type: 'string'
      }
    }
  }

  const output = expand(schema, valid)

  expect(output).toStrictEqual(expected)
})

it('should not modify input', async () => {
  const origin = { $id: generate(), foo: 'string' }
  const schema = clone(origin)

  expand(schema, valid)

  expect(schema).toStrictEqual(origin)
})

it('should expand reference', async () => {
  const cos = { foo: 'ref:path/id' }
  const schema = expand(cos, valid)

  expect(schema).toMatchObject({ properties: { foo: { $ref: 'path/id' } } })
})

it('should expand property reference', async () => {
  const cos = { foo: 'ref:id#/foo' }
  const schema = expand(cos, valid)

  expect(schema).toMatchObject({ properties: { foo: { $ref: 'id#/properties/foo' } } })
})

it('should expand root reference', async () => {
  const cos = { foo: 'ref:path/id#/' }
  const schema = expand(cos, valid)

  expect(schema).toMatchObject({ properties: { foo: { $ref: 'path/id#/' } } })
})

it('should expand root self-reference', async () => {
  const cos = { foo: 'ref:#/' }
  const schema = expand(cos, valid)

  expect(schema).toMatchObject({ properties: { foo: { $ref: '#/' } } })
})

it('should not throw on numbers ', async () => {
  expect(() => expand({ foo: 1 }, valid)).not.toThrow()
})

it.each(['string', 'number', 'integer', 'boolean', 'object', 'array'])('should expand Map<%s>',
  async (type) => {
    const cos = { foo: `<${type}>` }
    const schema = expand(cos, valid)

    expect(schema).toMatchObject({
      properties: {
        foo: {
          type: 'object',
          patternProperties: {
            '^.+$': { type }
          }
        }
      }
    })
  })

it.each([true, false])('should set additional properties to %s', async (allowed) => {
  const cos = { foo: 'string', '...': allowed }
  const schema = expand(cos, valid)

  expect(schema).toMatchObject({
    type: 'object',
    properties: {
      foo: {
        type: 'string'
      }
    },
    additionalProperties: allowed
  })
})

const FORMATS = ['date', 'time', 'date-time', 'duration', 'uri', 'uri-reference', 'uri-template', 'url', 'email', 'hostname', 'ipv4', 'ipv6', 'regex', 'uuid', 'json-pointer', 'json-pointer-uri-fragment', 'relative-json-pointer', 'byte', 'int32', 'int64', 'float', 'double', 'password', 'binary']

it.each(FORMATS)('should expand %s formats', async (format) => {
  const schema = expand(format, valid)

  expect(schema).toMatchObject({
    type: 'string',
    format
  })
})

it('should expand array of schemas to enum', async () => {
  const cos = [
    { foo: 'string' },
    { bar: 'number' }
  ]

  const schema = expand(cos, valid)

  expect(schema).toStrictEqual({
    oneOf: [
      {
        type: 'object',
        properties: {
          foo: {
            type: 'string'
          }
        }
      },
      {
        type: 'object',
        properties: {
          bar: {
            type: 'number'
          }
        }
      }
    ]
  })
})

it('should expand oneOf', async () => {
  const cos = { '/.+/': [{ type: 'string' }, { type: 'null' }] }

  const schema = expand(cos, valid)

  expect(schema).toStrictEqual({
    type: 'object',
    patternProperties: {
      '.+': {
        oneOf: [{ type: 'string' }, { type: 'null' }]
      }
    }
  })
})
