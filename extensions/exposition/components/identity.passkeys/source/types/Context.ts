import type { Redis } from 'ioredis'
import type { Call } from '@toa.io/types'
import type { Logs } from '@toa.io/extensions.telemetry'
import type { Configuration } from './Configuration'
import type { Passkey } from './Passkey'

export interface Context {
  configuration: Configuration
  stash: Redis
  logs: Logs
  local: {
    enumerate: Call<Passkey[]>
  }
}
