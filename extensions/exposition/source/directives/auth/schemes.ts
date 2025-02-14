import { type Remote, type Scheme } from './types'

export const PROVIDERS: Record<Scheme, Remote> = {
  basic: 'basic',
  token: 'tokens',
  bearer: 'federation'
}

export const INCEPTION: Remote[] = ['basic', 'federation']

export const PRIMARY: Scheme = 'token'
