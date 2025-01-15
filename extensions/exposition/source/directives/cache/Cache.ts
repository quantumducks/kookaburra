import { Control } from './Control'
import { Exact } from './Exact'
import type { Output } from '../../io'
import type { AuthenticatedContext, Directive } from './types'
import type { DirectiveFamily } from '../../RTD'
import type * as http from '../../HTTP'

export class Cache implements DirectiveFamily<Directive> {
  public readonly name: string = 'cache'
  public readonly mandatory: boolean = true

  public create (name: string, value: any): Directive {
    const Class = constructors[name]

    if (Class === undefined)
      throw new Error(`Directive 'cache:${name}' is not implemented`)

    return new Class(value)
  }

  public preflight (): Output {
    return null
  }

  public async settle
  (directives: Directive[], context: AuthenticatedContext, response: http.OutgoingMessage): Promise<void> {
    const directive = directives[0]

    response.headers ??= new Headers()

    if (directive === undefined) {
      if (context.identity !== null && !Control.disabled(response.headers)) {
        response.headers.set('cache-control', 'private')
        response.headers.append('vary', 'authorization')
      }
    } else
      directive.set(context, response.headers)
  }
}

const constructors: Record<string, new (value: any) => Directive> = {
  control: Control,
  exact: Exact
}
