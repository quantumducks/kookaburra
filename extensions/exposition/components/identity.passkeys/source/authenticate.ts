import { Err } from 'error-value'
import type { Context } from './types'
import type { AuthenticationResponseJSON } from '@simplewebauthn/server'
import type { Operation } from '@toa.io/types'

export class Effect implements Operation {
  private use!: Context['local']['use']
  private logs!: Context['logs']

  public mount (context: Context): void {
    this.use = context.local.use
    this.logs = context.logs
  }

  public async execute (input: Input): Promise<Output> {
    const { authority, ...response } = input

    const identity = await this.use({
      query: {
        criteria: `authority=="${authority}";kid=="${response.id}"`
      },
      input: response
    })

    if (identity === null) {
      this.logs.debug('Passkey not found', {
        authority,
        id: response.id
      })

      return ERR_MISS
    }

    if (identity instanceof Error)
      return identity

    return { identity }
  }
}

const ERR_MISS = new Err('MISS')

export interface Input extends Omit<AuthenticationResponseJSON, 'rawId'> {
  authority: string
  origin: string
}

export type Output = { identity: string } | Error
