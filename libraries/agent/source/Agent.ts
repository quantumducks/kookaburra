import * as http from 'node:http'
import * as https from 'node:https'
import * as assert from 'node:assert'
import { buffer } from 'node:stream/consumers'
import { trim } from '@toa.io/generic'
import * as undici from 'undici'
import { meros } from 'meros/node'
import * as protocol from './index'
import { parse, request } from './request'
import * as parser from './parse'
import { Captures } from './Captures'
import type { Readable } from 'stream'

/*
It is extracted from the Exposition.
Use its features to test.

/extensions/exposition/features/identity.feature
 */

export class Agent {
  public readonly origin?: string
  public response: string = ''
  public readonly captures: Captures
  public pending = new Set<http.IncomingMessage>()

  public constructor (origin?: string, captures: Captures = new Captures()) {
    this.origin = origin
    this.captures = captures
  }

  public async fetch (input: string): Promise<undici.Dispatcher.ResponseData> {
    const message = this.normalize(input)

    return await request(message, this.origin)
  }

  public async request (input: string): Promise<any> {
    const response = await this.fetch(input)

    this.response = await parser.response(response)
  }

  public async parts (input: string): Promise<ReturnType<typeof meros>> {
    const message = this.normalize(input)
    const req = parse(message, this.origin)

    const headers: Record<string, string> = {}

    for (const [key, value] of req.headers)
      headers[key] = value

    const protocol = new URL(req.url).protocol === 'https:' ? https : http

    const response = await new Promise<http.IncomingMessage>((resolve) => {
      const request = protocol.request(req.url, {
        method: req.method,
        headers
      }, (response) => resolve(response))

      request.end()
    })

    assert.ok(response.statusCode === 200,
      `Request failed with status ${response.statusCode}: ${req.url}`)

    this.pending.add(response)
    response.on('end', () => this.pending.delete(response))

    return await meros(response)
  }

  public abort (): void {
    for (const response of this.pending)
      response.destroy()

    this.pending.clear()
  }

  public responseIncludes (expected: string): void {
    const lines = trim(expected).split('\n')

    for (const line of lines) {
      if (line.trim() === '') continue

      const match = this.captures.capture(this.response, line)

      if (match === null)
        throw new assert.AssertionError({
          message: `Response is missing '${line}'`,
          expected: line,
          actual: this.response.slice(0, MAX_DIFF_LENGTH)
        })
    }
  }

  public responseExcludes (expected: string): void {
    const lines = trim(expected).split('\n')

    for (const line of lines) {
      const substituted = this.captures.substitute(line)

      if (this.response.includes(substituted))
        throw new assert.AssertionError({
          message: `Response contains '${line}'`,
          expected: line,
          actual: this.response.slice(0, MAX_DIFF_LENGTH)
        })
    }
  }

  public async stream (head: string, stream: Readable): Promise<any> {
    head = trim(head) + '\n\n'
    head = this.captures.substitute(head)

    const {
      url,
      method,
      headers
    } = protocol.parse.request(head)

    const href = new URL(url, this.origin).href

    const options = {
      method,
      headers,
      body: stream
    }

    try {
      const response = await undici.request(href, options)

      this.response = await protocol.parse.response(response)
    } catch (e: any) {
      console.error(e)
      console.error(e.cause)

      throw e
    }
  }

  public async streamMatch (head: string, stream: Readable): Promise<any> {
    const buf = await buffer(stream)
    const text = buf.toString('utf8')
    const expected = head + '\n\n' + text

    this.responseIncludes(expected)
  }

  private normalize (input: string): string {
    const substituted = this.captures.substitute(input)

    let [headers, body] = trim(substituted).split('\n\n')

    if (body !== undefined) headers += '\ncontent-length: ' + body?.length

    return headers + '\n\n' + (body ?? '')
  }
}

const MAX_DIFF_LENGTH = 4096
