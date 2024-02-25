import { Readable } from 'node:stream'
import { buffer } from 'node:stream/consumers'
import { formats } from './formats'
import { BadRequest, NotAcceptable, UnsupportedMediaType } from './exceptions'
import type { Context } from './Context'
import type * as http from 'node:http'

export function write
(context: Context, response: http.ServerResponse, message: OutgoingMessage): void {
  for (const transform of context.pipelines.response)
    transform(message)

  message.headers?.forEach((value, key) => response.setHeader(key, value))
  context.timing.append(response)

  if (message.body instanceof Readable)
    stream(message, context, response)
  else
    send(message, context, response)
}

export async function read (context: Context): Promise<any> {
  const type = context.request.headers['content-type']

  if (type === undefined)
    return undefined

  if (!(type in formats))
    throw new UnsupportedMediaType()

  const format = formats[type]
  const buf = await context.timing.capture('req:buffer', buffer(context.request))

  try {
    return format.decode(buf)
  } catch {
    throw new BadRequest()
  }
}

function send
(message: OutgoingMessage, context: Context, response: http.ServerResponse): void {
  if (message.body === undefined || message.body === null) {
    response.end()

    return
  }

  if (context.encoder === null)
    throw new NotAcceptable()

  const buf = context.encoder.encode(message.body)

  response
    .setHeader('content-type', context.encoder.type)
    .appendHeader('vary', 'accept')
    .end(buf)
}

function stream
(message: OutgoingMessage, context: Context, response: http.ServerResponse): void {
  const encoded = message.headers !== undefined && message.headers.has('content-type')

  if (encoded)
    message.body.pipe(response)
  else
    multipart(message, context, response)

  message.body.on('error', (e: Error) => {
    console.error(e)
    response.end()
  })
}

function multipart
(message: OutgoingMessage, context: Context, response: http.ServerResponse): void {
  if (context.encoder === null)
    throw new NotAcceptable()

  const encoder = context.encoder

  response.setHeader('content-type', `${encoder.multipart}; boundary=${BOUNDARY}`)

  message.body
    .map((part: unknown) => Buffer.concat([CUT, encoder.encode(part), CRLF]))
    .on('end', () => response.end(FINALCUT))
    .pipe(response)
}

const BOUNDARY = 'cut'
const CUT = Buffer.from(`--${BOUNDARY}\r\n`)
const CRLF = Buffer.from('\r\n')
const FINALCUT = Buffer.from(`--${BOUNDARY}--`)

export interface OutgoingMessage {
  status?: number
  headers?: Headers
  body?: any
}

export interface Query {
  [key: string]: string | undefined

  id?: string
  criteria?: string
  sort?: string
  omit?: string
  limit?: string
}
