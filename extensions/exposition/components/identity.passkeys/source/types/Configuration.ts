import type { Choice } from './authn/PublicKeyCredentialRequestOptions'

export interface Configuration {
  timeout: number
  verification: Choice
  residence: Choice
  algorithms: number[]
}
