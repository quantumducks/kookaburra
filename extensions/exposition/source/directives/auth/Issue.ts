import assert from 'node:assert'
import { Role } from './Role'
import type * as http from '../../HTTP'
import type { Component } from '@toa.io/core'
import type { Context, Discovery, Identity } from './types'

export class Issue {
  private readonly property: string
  private readonly discovery: Discovery
  private tokens!: Component

  public constructor (property: string, discovery: Discovery) {
    this.property = property
    this.discovery = discovery
  }

  public async authorize (_: unknown, context: Context): Promise<boolean> {
    return !('authorization' in context.request.headers)
  }

  public async settle (context: Context, response: http.OutgoingMessage): Promise<void> {
    assert(response.body?.constructor === Object.prototype.constructor, 'Response body expected to be an object')

    const id = response.body[this.property]

    assert(typeof id === 'string', `Response body property "${this.property}" expected to be a string`)

    const identity: Identity = { id, scheme: null, refresh: false }

    identity.roles = await Role.get(identity, this.discovery.roles)

    this.tokens ??= await this.discovery.tokens

    const token = await this.tokens.invoke<string>('encrypt', {
      input: { authority: context.authority, identity }
    })

    const authorization = `Token ${token}`

    response.headers ??= new Headers()
    response.headers.set('authorization', authorization)
    response.headers.set('cache-control', 'no-store')
    response.body.identity = identity
  }
}
