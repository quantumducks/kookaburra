import { type IncomingHttpHeaders } from 'node:http'
import { Readable } from 'node:stream'
import { type Request, type Response } from 'express'
import { buffer } from '@toa.io/streams'
import { formats } from './formats'
import { BadRequest, NotAcceptable, UnsupportedMediaType } from './exceptions'
import type { Format } from './formats'
import type { Timing } from './Timing'
import type { ParsedQs } from 'qs'

export function write
(request: IncomingMessage, response: Response, message: OutgoingMessage): void {
  for (const transform of request.pipelines.response)
    transform(message)

  message.headers?.forEach((value, key) => response.set(key, value))
  request.timing.append(response)

  if (message.body instanceof Readable)
    stream(message, request, response)
  else
    send(message, request, response)
}

export async function read (request: IncomingMessage): Promise<any> {
  const type = request.headers['content-type']

  if (type === undefined)
    return undefined

  if (!(type in formats))
    throw new UnsupportedMediaType()

  const format = formats[type]
  const buf = await request.timing.capture('req:buffer', buffer(request))

  try {
    return format.decode(buf)
  } catch {
    throw new BadRequest()
  }
}

function send (message: OutgoingMessage, request: IncomingMessage, response: Response): void {
  if (message.body === undefined || message.body === null) {
    response.end()

    return
  }

  if (request.encoder === null)
    throw new NotAcceptable()

  const buf = request.encoder.encode(message.body)

  response
    .set('content-type', request.encoder.type)
    .append('vary', 'accept')
    .end(buf)
}

function stream
(message: OutgoingMessage, request: IncomingMessage, response: Response): void {
  const encoded = message.headers !== undefined && message.headers.has('content-type')

  if (encoded)
    pipe(message, response)
  else
    multipart(message, request, response)

  message.body.on('error', (e: Error) => {
    console.error(e)
    response.end()
  })
}

function pipe (message: OutgoingMessage, response: Response): void {
  message.headers?.forEach((value, key) => response.set(key, value))
  message.body.pipe(response)
}

function multipart (message: OutgoingMessage, request: IncomingMessage, response: Response): void {
  if (request.encoder === null)
    throw new NotAcceptable()

  const encoder = request.encoder

  response.set('content-type', `${encoder.multipart}; boundary=${BOUNDARY}`)

  message.body
    .map((part: unknown) => Buffer.concat([CUT, encoder.encode(part)]))
    .on('end', () => response.end(FINALCUT))
    .pipe(response)
}

const BOUNDARY = 'cut'
const CUT = Buffer.from(`--${BOUNDARY}\r\n`)
const FINALCUT = Buffer.from(`--${BOUNDARY}--`)

export interface IncomingMessage extends Request {
  method: string
  path: string
  url: string
  headers: IncomingHttpHeaders
  query: Query
  parse: <T> () => Promise<T>
  encoder: Format | null
  subtype: string | null
  pipelines: {
    body: Array<(input: unknown) => unknown>
    response: Array<(output: OutgoingMessage) => void>
  }
  timing: Timing
}

export interface OutgoingMessage {
  status?: number
  headers?: Headers
  body?: any
}

export interface Query extends ParsedQs {
  id?: string
  criteria?: string
  sort?: string
  omit?: string
  limit?: string
}
