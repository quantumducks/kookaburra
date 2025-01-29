import { PassThrough, Readable } from 'node:stream'
import * as streamConsumers from 'node:stream/consumers'
import { once } from 'node:events'
import { generate } from 'randomstring'
import * as msgpack from 'msgpackr'
import { multipart, read, type OutgoingMessage } from './messages'
import { BadRequest, UnsupportedMediaType } from './exceptions'
import { formats } from './formats'
import { Timing } from './Timing'
import type * as http from 'node:http'
import type { Context } from './Context'

beforeEach(() => {
  jest.clearAllMocks()
})

describe('read', () => {
  it('should parse application/json', async () => {
    const path = generate()
    const headers = { 'content-type': 'application/json' }
    const input = { [generate()]: generate() }
    const json = JSON.stringify(input)
    const context = createContext(path, headers, json)
    const output = await read(context)

    expect(output).toStrictEqual(input)
  })

  it('should parse application/yaml', async () => {
    const path = generate()
    const headers = { 'content-type': 'application/yaml' }
    const yaml = 'foo: 1'
    const request = createContext(path, headers, yaml)
    const value = await read(request)

    expect(value).toStrictEqual({ foo: 1 })
  })

  it('should parse application/mskpack', async () => {
    const path = generate()
    const headers = { 'content-type': 'application/msgpack' }
    const input = { [generate()]: generate() }
    const msg = msgpack.encode(input)
    const request = createContext(path, headers, msg)
    const output = await read(request)

    expect(output).toStrictEqual(input)
  })

  it('should parse text/plain', async () => {
    const path = generate()
    const headers = { 'content-type': 'text/plain' }
    const input = generate()
    const request = createContext(path, headers, input)
    const output = await read(request)

    expect(output).toStrictEqual(input)
  })

  it('should throw on unsupported request media type', async () => {
    const path = generate()
    const headers = { 'content-type': 'wtf/' + generate() }
    const request = createContext(path, headers)

    await expect(read(request)).rejects.toThrow(UnsupportedMediaType)
  })

  it('should throw on malformed content', async () => {
    const path = generate()
    const text = '{ "foo": "val... oops '
    const headers = { 'content-type': 'application/json' }
    const request = createContext(path, headers, text)

    await expect(read(request)).rejects.toThrow(BadRequest)
  })

  it('should output correct mulitpart format', async () => {
    const response = new class extends PassThrough {
      public readonly headers = new Headers()

      public setHeader (key: string, value: string): this {
        this.headers.set(key, value)

        return this
      }
    }()

    const context = { encoder: formats['text/plain'] } as unknown as Context
    const message = { body: Readable.from(['Hello', 'New', 'World']) } as unknown as OutgoingMessage

    multipart(message, context, response as unknown as http.ServerResponse)

    await once(message.body, 'end')

    const result = await streamConsumers.text(response)

    expect(result).toBe([
      '--cut',
      '',
      'ACK',
      '--cut',
      '',
      'Hello',
      '--cut',
      '',
      'New',
      '--cut',
      '',
      'World',
      '--cut',
      '',
      'FIN',
      '--cut--'].join('\r\n'))
  })
})

export function createContext
(url: string, headers: Record<string, string> = {}, content: string | Buffer = ''):
jest.MockedObject<Context> {
  const buffer = Buffer.isBuffer(content) ? content : Buffer.from(content)
  const stream = Readable.from(buffer)

  const mock: Partial<Context> = {
    request: Object.assign(stream, {
      url,
      headers
    }) as unknown as Context['request'],
    url: new URL(url, 'https://host.local'),
    timing: new Timing(false)
  }

  return mock as unknown as jest.MockedObject<Context>
}
