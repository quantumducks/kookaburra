import Negotiator from 'negotiator'
import { console } from 'openspan'
import { Timing } from './Timing'
import { type Format, formats, types } from './formats'
import { read } from './messages'
import type { OutgoingMessage } from './messages'
import type * as http from 'node:http'

export class Context {
  public readonly authority: string
  public readonly request: IncomingMessage
  public readonly url: URL
  public readonly subtype: string | null = null
  public readonly encoder: Format | null = null
  public readonly timing: Timing
  public readonly debug: boolean

  public readonly pipelines: Pipelines = {
    body: [],
    response: []
  }

  public constructor (authority: string, request: IncomingMessage, properties: Properties) {
    this.authority = authority
    this.request = request

    this.url = new URL(request.url, `https://${request.headers.host}`)
    this.timing = new Timing(properties.trace)
    this.debug = properties.debug
    this.log(request)

    if (this.request.headers.accept !== undefined) {
      const match = SUBTYPE.exec(this.request.headers.accept)

      if (match !== null) {
        const {
          type,
          subtype,
          suffix
        } = match.groups!

        this.request.headers.accept = `${type}/${suffix}`
        this.subtype = subtype
      }
    }

    const negotiator = new Negotiator(this.request)
    const mediaType = negotiator.mediaType(types)

    if (mediaType !== undefined)
      this.encoder = formats[mediaType]
  }

  public async body<T> (): Promise<T> {
    let value = await read(this)

    for (const transform of this.pipelines.body)
      value = await transform(value)

    return value
  }

  private log (request: IncomingMessage): void {
    const headers = { ...request.headers }

    if (headers.authorization !== undefined)
      // only scheme
      headers.authorization = headers.authorization.slice(0, headers.authorization.indexOf(' '))

    console.debug('Received request', { method: request.method, url: request.url, headers })
  }
}

export interface IncomingMessage extends http.IncomingMessage {
  url: string
  method: string
}

interface Pipelines {
  body: Array<(input: unknown) => unknown>
  response: Array<(output: OutgoingMessage) => void | Promise<void>>
}

interface Properties {
  debug: boolean
  trace: boolean
}

const SUBTYPE = /^(?<type>\w{1,32})\/(vnd\.toa\.(?<subtype>\S{1,32})\+)(?<suffix>\S{1,32})$/
