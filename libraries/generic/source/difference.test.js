'use strict'

const { difference } = require('../source/difference')

it('should return object difference', () => {
  const a = {
    foo: 'old',
    bar: {
      baz: 1,
      ok: 1,
      a: 1
    }
  }

  const b = {
    foo: 'new',
    bar: {
      baz: 2,
      ok: 1,
      b: 2
    }
  }

  const diff = difference(a, b)

  expect(diff).toStrictEqual({
    foo: 'new',
    bar: {
      baz: 2,
      a: undefined,
      b: 2
    }
  })
})
