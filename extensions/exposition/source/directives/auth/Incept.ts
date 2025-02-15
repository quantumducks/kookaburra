import assert from 'node:assert'
import { console } from 'openspan'
import * as http from '../../HTTP'
import { split } from './split'
import { create } from './create'
import { PROVIDERS, INCEPTION } from './schemes'
import type { Maybe } from '@toa.io/types'
import type { Directive, Discovery, Identity, Context, Schemes } from './types'

export class Incept implements Directive {
  private readonly property: string | null
  private readonly discovery: Discovery
  private readonly schemes: Schemes = {} as unknown as Schemes

  public constructor (property: string, discovery: Discovery) {
    assert.ok(property === null || typeof property === 'string',
      '`auth:incept` value must be a string or null')

    this.property = property
    this.discovery = discovery
  }

  public authorize (identity: Identity | null): boolean {
    return identity === null
  }

  public reply (context: Context): http.OutgoingMessage | null {
    if (this.property !== null)
      return null

    const body = create(context.request.headers.authorization)

    return { body }
  }

  public async settle (context: Context, response: http.OutgoingMessage): Promise<void> {
    const id = response.body?.[this.property ?? 'id']

    if (id === undefined) {
      console.debug('Inception skipped: response does not contain expected property', {
        property: this.property,
        response
      })

      return
    }

    assert(typeof id === 'string', `Response body property "${this.property}" expected to be a string`)

    if (context.request.headers.authorization !== undefined)
      context.identity = await this.incept(context, id)
    else
      context.identity = { id, scheme: null, refresh: true, roles: [] }
  }

  private async incept (context: Context, id: string): Promise<Identity> {
    const [scheme, credentials] = split(context.request.headers.authorization!)
    const provider = PROVIDERS[scheme]

    if (provider === undefined)
      throw new http.BadRequest('Authentication scheme is not supported')

    if (!INCEPTION.includes(provider))
      throw new http.BadRequest('Authentication scheme does not support identity inception')

    this.schemes[scheme] ??= await this.discovery[provider]

    const identity = await this.schemes[scheme].invoke<Maybe<Identity>>('incept', {
      input: {
        authority: context.authority,
        id,
        credentials
      }
    })

    if (identity instanceof Error)
      throw new http.UnprocessableEntity(identity)

    identity.scheme = scheme
    identity.roles = []

    return identity
  }
}
