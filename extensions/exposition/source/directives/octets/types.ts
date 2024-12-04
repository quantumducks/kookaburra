import type * as io from '../../io'
import type { Identity } from '../auth/types' // meh

export interface Extension {
  identity?: Identity
  octets?: string
}

export type Input = io.Input & Extension
