import { PassThrough } from 'node:stream'
import { match } from 'matchacho'
import * as http from '../../HTTP'
import { cors } from '../cors'
import * as schemas from './schemas'
import { Workflow } from './workflows'
import { Directive } from './Directive'
import { toBytes } from './bytes'
import type { Readable } from 'stream'
import type { Parameter } from '../../RTD'
import type { Unit, Location } from './workflows'
import type { Entry } from '@toa.io/extensions.storages'
import type { Remotes } from '../../Remotes'
import type { Err } from 'error-value'
import type { Component } from '@toa.io/core'
import type { Output } from '../../io'
import type { Input } from './types'

export class Put extends Directive {
  public readonly targeted = false

  private readonly location?: string
  private readonly accept?: string
  private readonly limit: number
  private readonly limitString: string
  private readonly trust?: Array<string | RegExp>
  private readonly workflow?: Workflow
  private readonly discovery: Record<string, Promise<Component>> = {}
  private storage: Component | null = null

  public constructor
  (options: Options | null, discovery: Promise<Component>, remotes: Remotes) {
    super()

    schemas.put.validate<Options>(options)

    this.accept = match(options?.accept,
      String, (value: string) => value,
      Array, (types: string[]) => types.join(','),
      undefined)

    if (options?.workflow !== undefined)
      this.workflow = new Workflow(options.workflow, remotes)

    if (options?.trust !== undefined)
      this.trust = options.trust.map((value: string) =>
        value.startsWith('/') ? new RegExp(value.slice(1, -1)) : value)

    if (options?.location !== undefined)
      this.location = options.location

    this.limitString = options?.limit ?? '64MiB'
    this.limit = toBytes(this.limitString)
    this.discovery.storage = discovery

    cors.allow('content-attributes')
    cors.allow('content-location')
  }

  public async apply (storage: string, input: Input, parameters: Parameter[]): Promise<Output> {
    this.storage ??= await this.discovery.storage

    const request: StoreRequest = {
      input: {
        storage,
        request: input.request,
        location: this.location,
        accept: this.accept,
        limit: this.limit,
        trust: this.trust
      }
    }

    const entry = await this.storage.invoke<Entry>('put', request)

    return match<Output>(entry,
      Error, (error: Err) => this.throw(error),
      () => this.reply(input, storage, entry, parameters))
  }

  // eslint-disable-next-line max-params
  private reply (input: Input, storage: string, entry: Entry, parameters: Parameter[]): Output {
    const body = this.workflow === undefined
      ? entry
      : this.execute(input, storage, entry, parameters)

    return { body }
  }

  // eslint-disable-next-line max-params
  private execute
  (input: Input, storage: string, entry: Entry, parameters: Parameter[]): Readable {
    const stream = new PassThrough({ objectMode: true })

    stream.push(entry)

    const location: Location = {
      storage,
      authority: input.authority,
      path: input.request.url
    }

    this.workflow!.execute(location, entry, parameters).pipe(stream)

    return stream
  }

  private throw (error: Err): never {
    throw match(error.code,
      'NOT_ACCEPTABLE', () => new http.UnsupportedMediaType(),
      'TYPE_MISMATCH', () => new http.BadRequest(),
      'LIMIT_EXCEEDED', () => new http.RequestEntityTooLarge(`Size limit is ${this.limitString}`),
      'LOCATION_UNTRUSTED', () => new http.Forbidden(error.message),
      'LOCATION_LENGTH', () => new http.BadRequest(error.message),
      'LOCATION_UNAVAILABLE', () => new http.NotFound(error.message),
      'INVALID_ID', () => new http.BadRequest(error.message),
      error)
  }
}

export interface Options {
  location?: string
  accept?: string | string[]
  limit?: string
  workflow?: Unit[] | Unit
  trust?: string[]
}

interface StoreRequest {
  input: {
    storage: string
    request: Input['request']
    location?: string
    accept?: string
    limit?: number
    trust?: Array<string | RegExp>
    attributes?: Record<string, string>
  }
}
