import assert from 'node:assert'
import type * as http from '../../HTTP'
import type { Context } from './types'

export class Issue {
  private readonly property: string

  public constructor (property: string) {
    this.property = property
  }

  public async authorize (_: unknown, context: Context): Promise<boolean> {
    return !('authorization' in context.request.headers)
  }

  public async settle (context: Context, response: http.OutgoingMessage): Promise<void> {
    assert(response.body?.constructor === Object.prototype.constructor, 'Response body expected to be an object')

    const id = response.body[this.property]

    assert(typeof id === 'string', `Response body property "${this.property}" expected to be a string`)

    context.identity = { id, scheme: null, refresh: true }
  }
}
