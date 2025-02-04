import { MAX_KEYS } from './lib/const'
import type { Context, Passkey } from './types'

export async function computation ({ authority, identity }: Input, context: Context): Promise<Passkey[]> {
  return await context.local.enumerate({
    query: {
      criteria: `authority==${authority};identity==${identity}`,
      projection: ['aid', 'synced', 'label'],
      limit: MAX_KEYS
    }
  })
}

interface Input {
  authority: string
  identity: string
}
