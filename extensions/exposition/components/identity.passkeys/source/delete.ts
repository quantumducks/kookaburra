import type { Context } from './types'

export async function effect ({ authority, identity, id }: Input, context: Context): Promise<void | null> {
  return await context.local.terminate({
    query: {
      criteria: `authority==${authority};identity==${identity};id==${id}`
    }
  })
}

interface Input {
  authority: string
  identity: string
  id: string
}
