import fs from 'node:fs'
import os from 'node:os'
import * as http from 'node:http'
import { once } from 'node:events'
import { setTimeout } from 'node:timers/promises'
import { Connector } from '@toa.io/core'
import { type OutgoingMessage, write } from './messages'
import { ClientError, Exception } from './exceptions'
import { Context } from './Context'
import type { IncomingMessage } from './Context'

export class Server extends Connector {
  private readonly server: http.Server = http.createServer()
  private readonly properties: Properties
  private readonly authorities: Record<string, string>
  private process?: Processing
  private ready: boolean = false
  private startedAt: number = 0

  private constructor (properties: Properties) {
    super()

    this.properties = properties
    this.authorities = Object.fromEntries(Object.entries(properties.authorities).map(([key, value]) => [value, key]))

    this.server.on('request', (req, res) => this.listener(req, res))
  }

  public static create (options: Options): Server {
    const properties: Properties = Object.assign({}, DEFAULTS, options)

    return new Server(properties)
  }

  public attach (process: Processing): void {
    this.process = process
  }

  protected override async open (): Promise<void> {
    this.startedAt = Date.now()
    this.server.listen(this.properties.port)

    await once(this.server, 'listening')

    console.info('HTTP Server is listening')

    await setTimeout(this.properties.delay)

    this.ready = true

    console.info('Ready')
  }

  protected override async close (): Promise<void> {
    this.server.close()
    this.ready = false

    console.info('HTTP Server stopped accepting new connections')

    await once(this.server, 'close')

    console.info('HTTP Server has been stopped')
  }

  private listener (request: http.IncomingMessage, response: http.ServerResponse): void {
    if (request.method === undefined || !this.properties.methods.has(request.method)) {
      response.writeHead(501).end()

      return
    }

    if (request.url === '/.ready') {
      if (this.ready)
        response.writeHead(200).end()
      else {
        const remaining = (Math.ceil((Date.now() - this.startedAt) / 1000)).toString()

        response.writeHead(503, { 'retry-after': remaining }).end()
      }

      return
    }

    if (request.headers.host === undefined || !(request.headers.host in this.authorities)) {
      response.writeHead(404).end('Unknown authority')

      return
    }

    const authority = this.authorities[request.headers.host]
    const context = new Context(authority, request as IncomingMessage, this.properties)

    this.process!(context)
      .then(this.success(context, response))
      .catch(this.fail(context, response))
  }

  private success (context: Context, response: http.ServerResponse) {
    return (message: OutgoingMessage) => {
      let status = message.status

      if (status === undefined)
        if (message.body === null)
          status = 404
        else if (context.request.method === 'POST')
          status = 201
        else if (message.body === undefined)
          status = 204
        else
          status = 200

      response.statusCode = message.status = status
      write(context, response, message)
    }
  }

  private fail (context: Context, response: http.ServerResponse) {
    return async (exception: Error) => {
      if (!context.request.complete)
        await adam(context.request)

      response.statusCode = exception instanceof Exception ? exception.status : 500

      const message: OutgoingMessage = { status: response.statusCode }
      const verbose = exception instanceof ClientError || this.properties.debug

      if (verbose)
        message.body =
          exception instanceof Exception
            ? exception.body
            : exception.stack ?? exception.message

      write(context, response, message)
    }
  }
}

// https://github.com/whatwg/fetch/issues/1254
async function adam (request: http.IncomingMessage): Promise<any> {
  const devnull = fs.createWriteStream(os.devNull)

  request.pipe(devnull)

  return once(request, 'end')
}

export const PORT = 8000
export const DELAY = 3 // seconds

const DEFAULTS: Omit<Properties, 'authorities'> = {
  methods: new Set<string>(['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS']),
  debug: false,
  trace: false,
  port: PORT,
  delay: DELAY * 1000
}

interface Properties {
  authorities: Record<string, string>
  methods: Set<string>
  debug: boolean
  trace: boolean
  port: number
  delay: number
}

export type Options = { authorities: Properties['authorities'] } & {
  [K in Exclude<keyof Properties, 'authorities'>]?: Properties[K]
}

export type Processing = (input: Context) => Promise<OutgoingMessage>
