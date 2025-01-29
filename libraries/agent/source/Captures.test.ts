/* eslint-disable no-template-curly-in-string */

import { Captures } from './Captures'
import type { Functions } from './functions'

let captures: Captures

beforeEach(() => {
  captures = new Captures()
})

it('should capture parts of the source', () => {
  captures.capture('hello world', 'hello ${{ word }}')

  const word = captures.get('word')

  expect(word).toBe('world')
})

it('should not capture parts of the words', () => {
  captures.capture('super-hello world', 'hello ${{ word }}')

  const word = captures.get('word')

  expect(word).toBe(undefined)
})

it('should substitute multiple times', () => {
  captures.set('word', 'foo')

  expect(captures.capture('hey foo foo', 'hey ${{ word }} ${{ word }}'))
    .toEqual([])

  expect(captures.capture('hey foo bar', 'hey ${{ word }} ${{ word }}'))
    .toBe(null)
})

it('should substitute parts of the words', () => {
  captures.set('host', 'domain.com')

  expect(captures.capture('foo', 'https://${{ host }}/path'))
    .toBe(null)

  expect(captures.capture('https://domain.com/path', 'https://${{ host }}/path'))
    .toEqual([])
})

it('should substitute padded', () => {
  captures.set('one', 'one')
  captures.set('two', 'two')

  const result = captures.substitute(`
    object:
      \${{ one }}: ok
      \${{ two }}: ok
  `)

  console.log(result)
})

describe('pipelines', () => {
  it('should generate id', () => {
    const result = captures.substitute('hello #{{ id }}')

    expect(result).toMatch(/^hello [a-z0-9]{32}$/)
  })

  it('should set variable', () => {
    const result = captures.substitute('hello #{{ id | set test }}')

    expect(result).toMatch(/^hello [a-z0-9]{32}$/)
    expect(captures.get('test')).toMatch(/^[a-z0-9]{32}$/)
  })

  it('should get variable', () => {
    captures.set('foo', 'world')

    expect(captures.substitute('hello #{{ get foo }}')).toBe('hello world')
  })

  it('should encode basic credentials', () => {
    captures.set('Bubba.username', 'bubba')
    captures.set('Bubba.password', 'password')

    const result = captures.substitute('Basic #{{ basic Bubba }}')

    expect(result).toBe('Basic YnViYmE6cGFzc3dvcmQ=')
  })

  it('should generate password', () => {
    expect(captures.substitute('#{{ password }}')).toMatch(/^.{16}$/)
    expect(captures.substitute('#{{ password 8 }}')).toMatch(/^.{8}$/)
  })

  it('should generate email', () => {
    expect(captures.substitute('#{{ email }}')).toMatch(/^.*@agent\.test$/)
    expect(captures.substitute('#{{ email @example.com }}')).toMatch(/^.*@example\.com$/)
  })

  it('should generate random basic credentials', () => {
    const credentials = captures.substitute('#{{ basic }}')
    const [username, password] = Buffer.from(credentials, 'base64').toString().split(':')

    expect(username).toMatch(/^.*@agent\.test$/)
    expect(password).toMatch(/^.{16}$/)
  })

  it('should substitute now', () => {
    // non-deterministic :(
    const now = Date.now().toString().slice(0, -3)
    const past = (Date.now() - 86400000).toString().slice(0, -3)
    const nowRx = new RegExp(`hello ${now}\\d{2}`)
    const pastRx = new RegExp(`hello ${past}\\d{2}`)

    expect(captures.substitute('hello #{{ now }}')).toMatch(nowRx)
    expect(captures.substitute('hello #{{ now -86400000 }}')).toMatch(pastRx)
  })

  it('should convert date to utc string', () => {
    const now = new Date().toUTCString().slice(0, -7)
    const past = new Date(Date.now() - 86400000).toUTCString().slice(0, -7)
    const nowRx = new RegExp(`hello ${now}:\\d{2} GMT`)
    const pastRx = new RegExp(`hello ${past}:\\d{2} GMT`)

    expect(captures.substitute('hello #{{ utc }}')).toMatch(nowRx)
    expect(captures.substitute('hello #{{ now | utc }}')).toMatch(nowRx)
    expect(captures.substitute('hello #{{ now -86400000 | utc }}')).toMatch(pastRx)
  })

  it('should convert to timestamp', () => {
    const timestamp = Math.floor(Date.now() / 1000)

    expect(captures.substitute('hello #{{ now | utc | unix }}')).toBe(`hello ${timestamp}`)
  })

  it('should print', () => {
    captures.substitute('hello #{{ now | print }}')

    // look at the console
  })

  it('should execute custom function', () => {
    const functions: Functions = {
      // eslint-disable-next-line max-params
      concat: function (this: Captures, value: string, a: string, b: string): string {
        return a + b
      }
    }

    const captures = new Captures(functions)

    expect(captures.substitute('#{{ concat foo bar }}')).toBe('foobar')
  })
})
