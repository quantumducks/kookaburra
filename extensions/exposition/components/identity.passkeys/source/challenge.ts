import { randomBytes } from 'node:crypto'

import type { Operation } from '@toa.io/types'
import type { Context } from './types'
import type { PublicKeyCredentialRequestOptions } from './types/authn'

export class Effect implements Operation {
  private timeout!: number
  private authenticator!: PublicKeyCredentialRequestOptions['authenticatorSelection']
  private credParams!: PublicKeyCredentialRequestOptions['pubKeyCredParams']

  public mount (context: Context): void {
    this.timeout = context.configuration.timeout
    this.authenticator = { userVerification: context.configuration.verification, residentKey: context.configuration.residence }
    this.credParams = context.configuration.algorithms.map((alg) => ({ type: 'public-key', alg }))
  }

  public async execute (input: Input): Promise<PublicKeyCredentialRequestOptions> {
    const challenge = Buffer.from(randomBytes(32)).toString('base64url')

    return {
      challenge,
      timeout: this.timeout,
      authenticatorSelection: this.authenticator,
      pubKeyCredParams: this.credParams
    }
  }
}

interface Input {
  authority: string
  purpose: 'create' | 'authenticate'
  identity: string | null
}
