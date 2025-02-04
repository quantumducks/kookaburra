import { assertionsAsValues } from './lib/assertions-as-values.js'
import { decode } from './lib/jwt'
import type { Request } from '@toa.io/types'
import type { Context, Entity, TransitInput } from './types'

async function incept (input: Input, context: Context): Promise<Output> {
  const { iss, sub } = await decode(input.credentials, context.configuration.trust)
  const request: Request<TransitInput> = { input: { authority: input.authority, iss, sub } satisfies Omit<Entity, 'id'> }

  if (input.id !== undefined)
    request.query = { id: input.id }

  return await context.local.transit(request)
}

export interface Input {
  authority: string
  credentials: string
  id?: string
}

export interface Output {
  id: string
}

export const effect = assertionsAsValues(incept)
