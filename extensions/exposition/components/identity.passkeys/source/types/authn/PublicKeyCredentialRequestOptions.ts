export interface PublicKeyCredentialRequestOptions {
  challenge: string
  timeout: number
  authenticatorSelection?: {
    residentKey?: Choice
    userVerification?: Choice
  }
  pubKeyCredParams: CredParams[]
}

export type Choice = 'required' | 'preferred' | 'discouraged'

interface CredParams {
  type: 'public-key'
  alg: number
}
