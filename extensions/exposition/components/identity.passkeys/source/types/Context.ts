import type { Observation, Transition } from '@toa.io/types'
import type { Redis } from 'ioredis'
import type { Logs } from '@toa.io/extensions.telemetry'
import type { Configuration } from './Configuration'
import type { Passkey } from './Passkey'
import type { Input as UseInput, Output as UseOutput } from '../use'

export interface Context {
  configuration: Configuration
  stash: Redis
  logs: Logs
  local: {
    enumerate: Observation<Passkey[], never, Passkey>
    terminate: Transition<void, void, Passkey>
    use: Transition<UseOutput, UseInput>
  }
}
