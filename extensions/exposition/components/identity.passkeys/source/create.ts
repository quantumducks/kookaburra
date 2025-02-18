import { verifyRegistrationResponse, type RegistrationResponseJSON } from '@simplewebauthn/server'
import { Err } from 'error-value'
import type { Operation } from '@toa.io/types'
import type { Context, Passkey } from './types'

// https://github.com/MasterKale/SimpleWebAuthn/blob/master/packages/server/src/registration/verifyRegistrationResponse.ts#L51

export class Transition implements Operation {
  private algorithms!: number[]
  private stash!: Context['stash']
  private logs!: Context['logs']
  private verification!: boolean
  private presence!: boolean

  public mount (context: Context): void {
    this.algorithms = context.configuration.algorithms
    this.verification = context.configuration.verification === 'required'
    this.presence = context.configuration.residence === 'required'
    this.stash = context.stash
    this.logs = context.logs
  }

  public async execute (input: Input, object: Passkey): Promise<Passkey | Error> {
    const { authority, identity, label, ...response } = input

    // rawId is not sent from the client
    response.rawId = response.id

    const verified = await verifyRegistrationResponse({
      response,
      expectedOrigin: input.origin,
      expectedChallenge: async (challenge) => this.verifyChallenge(authority, challenge),
      supportedAlgorithmIDs: this.algorithms,
      requireUserVerification: this.verification,
      requireUserPresence: this.presence
    }).catch((e) => {
      this.logs.info('Failed to verify registration response', { message: e.message })

      return ERR_FAILED as Error
    })

    if (verified instanceof Error)
      return verified

    if (!verified.verified || verified.registrationInfo?.credential === undefined)
      return ERR_INVALID

    const reg = verified.registrationInfo

    object.authority = authority
    object.identity = identity
    object.kid = reg.credential.id
    object.aid = reg.aaguid
    object.synced = reg.credentialBackedUp
    object.key = Buffer.from(reg.credential.publicKey).toString('base64url')
    object.transports = reg.credential.transports
    object.label = label

    return object
  }

  private async verifyChallenge (authority: string, challenge: string): Promise<boolean> {
    const n = await this.stash.del(`challenge:${authority}:${challenge}`)

    return n === 1
  }
}

const ERR_FAILED = new Err('FAILED')
const ERR_INVALID = new Err('INVALID')

export interface Input extends RegistrationResponseJSON {
  authority: string
  origin: string
  identity: string
  label?: string
}
