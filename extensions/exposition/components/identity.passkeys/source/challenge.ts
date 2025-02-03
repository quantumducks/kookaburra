import { randomBytes } from 'node:crypto'
import { MAX_KEYS } from './lib/const'
import type { Operation } from '@toa.io/types'
import type { Context } from './types'

export class Effect implements Operation {
  private timeout!: number
  private authenticator?: AuthenticatorSelectionCriteria
  private credParams!: PublicKeyCredentialParameters[]
  private stash!: Context['stash']
  private enumerate!: Context['local']['enumerate']

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

    this.stash = context.stash
    this.enumerate = context.local.enumerate
  }

  public async execute (input: Input): Promise<Output> {
    const { identity, authority } = input
    const challenge = await this.createChallenge(authority)

    const options: Output = {
      challenge,
      timeout: this.timeout
    }

    if (identity === undefined)
      return options

    const keys = await this.enumerate({
      query: {
        criteria: `identity==${identity}`,
        projection: ['kid', 'transports'],
        limit: MAX_KEYS
      }
    })

    return {
      ...options,
      excludeCredentials: keys.map(({ kid, transports }) => ({ id: kid, transports })),
      pubKeyCredParams: this.credParams,
      authenticatorSelection: this.authenticator
    }
  }

  private async createChallenge (authority: string): Promise<string> {
    const challenge = randomBytes(32).toString('base64url')
    const key = `challenge:${authority}:${challenge}`

    await this.stash.set(key, 1, 'EX', this.timeout / 1000 * EX_GAP)

    return challenge
  }
}

const EX_GAP = 1.5

interface Input {
  authority: string
  identity?: string | null
}

type Output = CreationOptions | RequestOptions

interface CommonOptions {
  challenge: string
  timeout: number
}

interface KeyDescriptor {
  id: string
  transports?: string[]
}

type CreationOptions =
  CommonOptions
  & Omit<PublicKeyCredentialCreationOptions, 'rp' | 'user' | 'excludeCredentials'>
  & { excludeCredentials: KeyDescriptor[] }

type RequestOptions = CommonOptions
