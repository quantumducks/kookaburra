import * as undici from 'undici'
import * as parser from './parse'
import type { HTTPRequest } from './parse/request'

const pools = new Map<string, undici.Pool>()

export async function request (http: string, options: Options = {}): Promise<undici.Dispatcher.ResponseData> {
  const { base, ...requestOptions } = options
  const { method, headers, body, url } = parse(http, base)
  const { origin, pathname, search } = new URL(url)

  if (origin === undefined)
    throw new Error('Invalid Host header')

  if (!pools.has(origin))
    pools.set(origin, new undici.Pool(origin))

  const pool = pools.get(origin)!

  return await pool.request({
    ...requestOptions,
    path: pathname + search,
    method,
    headers,
    body
  })
}

export function parse (http: string, origin?: string): HTTPRequest {
  const { method, url, headers, body } = parser.request(http, origin)

  origin ??= 'https://' + headers.get('host')

  const href = new URL(url, origin).href

  return { method, headers, body, url: href }
}

type Options = Partial<undici.Dispatcher.RequestOptions> & { base?: string }
