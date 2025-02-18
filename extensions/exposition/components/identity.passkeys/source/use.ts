import { Err } from 'error-value'
import { verifyAuthenticationResponse } from '@simplewebauthn/server'
import type { AuthenticationResponseJSON, WebAuthnCredential } from '@simplewebauthn/server'
import type { Operation } from '@toa.io/types'
import type { Context, Passkey } from './types'

export class Transition implements Operation {
  private stash!: Context['stash']
  private logs!: Context['logs']
  private verification!: boolean
  private presence!: boolean

  public mount (context: Context): void {
    this.stash = context.stash
    this.logs = context.logs
    this.verification = context.configuration.verification === 'required'
    this.presence = context.configuration.residence === 'required'
  }

  public async execute (input: Input, object: Passkey): Promise<Output> {
    const { origin, ...rest } = input
    const response: AuthenticationResponseJSON = { ...rest, rawId: input.id }
    const credential = toCredential(object)

    const verified = await verifyAuthenticationResponse({
      response,
      credential,
      expectedOrigin: origin,
      expectedRPID: new URL(origin).hostname,
      expectedChallenge: async (challenge) => this.verifyChallenge(object.authority, challenge),
      requireUserVerification: this.verification
    }).catch((e) => {
      this.logs.info('Failed to verify authentication response', { message: e.message })

      return ERR_FAILED as Error
    })

    if (verified instanceof Error)
      return verified

    if (!verified.verified)
      return ERR_INVALID

    object.counter = verified.authenticationInfo.newCounter

    return object.identity
  }

  private async verifyChallenge (authority: string, challenge: string): Promise<boolean> {
    const key = `challenge:${authority}:${challenge}`
    const n = await this.stash.del(`challenge:${authority}:${challenge}`)

    this.logs.debug(n === 1 ? 'Challenge verified' : 'Challenge not found', { key, n })

    return n === 1
  }
}

function toCredential (passkey: Passkey): WebAuthnCredential {
  return {
    id: passkey.id,
    publicKey: new Uint8Array(Buffer.from(passkey.key, 'base64url')),
    counter: passkey.counter,
    transports: passkey.transports
  }
}

const ERR_FAILED = new Err('FAILED')
const ERR_INVALID = new Err('INVALID')

export interface Input extends Omit<AuthenticationResponseJSON, 'rawId'> {
  origin: string
}

export type Output = string | Error
