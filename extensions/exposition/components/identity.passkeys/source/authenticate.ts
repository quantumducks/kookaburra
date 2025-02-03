import { Err } from 'error-value'
import type { Context } from './types'
import type { AuthenticationResponseJSON } from '@simplewebauthn/server'
import type { Operation } from '@toa.io/types'

export class Effect implements Operation {
  private use!: Context['local']['use']

  public mount (context: Context): void {
    this.use = context.local.use
  }

  public async execute (input: Input): Promise<Output> {
    const { authority, ...response } = input

    const ok = await this.use({
      query: {
        criteria: `authority=="${authority}";kid=="${response.id}"`
      },
      input: response
    })

    if (ok === null) {
      console.debug('Key not found', {
        authority,
        id: response.id
      })

      return ERR_MISS
    }

    if (ok instanceof Error)
      return ok

    return ok
  }
}

const ERR_MISS = new Err('MISS')

export interface Input extends Omit<AuthenticationResponseJSON, 'rawId'> {
  authority: string
  origin: string
}

export type Output = string | Error
