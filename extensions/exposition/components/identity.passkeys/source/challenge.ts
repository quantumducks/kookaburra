import { randomBytes } from 'node:crypto'
import { newid } from '@toa.io/generic'
import { MAX_KEYS } from './lib/const'
import type { Operation } from '@toa.io/types'
import type { Context } from './types'

export class Effect implements Operation {
  private timeout!: number
  private authenticator?: AuthenticatorSelectionCriteria
  private credParams!: PublicKeyCredentialParameters[]
  private enumerate!: Context['local']['enumerate']
  private stash!: Context['stash']
  private logs!: Context['logs']

  public mount (context: Context): void {
    this.timeout = context.configuration.timeout
    this.credParams = context.configuration.algorithms.map((alg) => ({ type: 'public-key', alg }))

    if (context.configuration.verification !== undefined) {
      this.authenticator ??= {}
      this.authenticator.userVerification = context.configuration.verification
    }

    if (context.configuration.residence !== undefined) {
      this.authenticator ??= {}
      this.authenticator.residentKey = context.configuration.residence
    }

    this.enumerate = context.local.enumerate
    this.stash = context.stash
    this.logs = context.logs
  }

  public async execute (input: Input): Promise<Output> {
    const { type, identity, authority } = input
    const challenge = await this.createChallenge(authority)

    const options: Output = {
      challenge,
      timeout: this.timeout
    }

    if (type === 'creation')
      options.identity = identity ?? newid()

    const keys = identity === undefined
      ? undefined
      : await this.enumerate({
        query: {
          criteria: `identity==${identity}`,
          projection: ['kid', 'transports'],
          limit: MAX_KEYS
        }
      })

    if (type === 'creation')
      return {
        ...options,
        excludeCredentials: keys?.map(({ kid, transports }) => ({ id: kid, transports })),
        pubKeyCredParams: this.credParams,
        authenticatorSelection: this.authenticator
      } satisfies CreationOptions
    else
      return {
        ...options,
        allowCredentials: keys?.map(({ kid, transports }) => ({ id: kid, transports })),
        userVerification: this.authenticator?.userVerification
      } satisfies RequestOptions
  }

  private async createChallenge (authority: string): Promise<string> {
    const challenge = randomBytes(32).toString('base64url')
    const key = `challenge:${authority}:${challenge}`

    this.logs.debug('Creating challenge', { key })

    await this.stash.set(key, 1, 'EX', this.timeout / 1000 * EX_GAP)

    return challenge
  }
}

const EX_GAP = 1.5

interface Input {
  type: 'creation' | 'request'
  authority: string
  identity?: string | null
}

type Output = CreationOptions | RequestOptions

interface CommonOptions {
  identity?: string
  challenge: string
  timeout: number
}

interface KeyDescriptor {
  id: string
  transports?: string[]
}

type CreationOptions =
  CommonOptions
  & Omit<PublicKeyCredentialCreationOptions, 'challenge' | 'rp' | 'user' | 'excludeCredentials'>
  & { excludeCredentials?: KeyDescriptor[] }

type RequestOptions =
  CommonOptions
  & Omit<PublicKeyCredentialRequestOptions, 'challenge' | 'allowCredentials'>
  & { allowCredentials?: KeyDescriptor[] }
