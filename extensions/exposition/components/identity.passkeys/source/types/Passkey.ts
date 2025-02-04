import type { AuthenticatorTransportFuture } from '@simplewebauthn/server'

export interface Passkey {
  id: string
  authority: string
  identity: string
  kid: string
  aid: string
  synced: boolean
  key: string
  counter: number
  transports?: AuthenticatorTransportFuture[]
  label?: string
}
