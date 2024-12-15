import { Stub } from './Stub'
import { Throw } from './Throw'
import { Sleep } from './Sleep'
import { type Directive } from './types'
import type { Input, Output } from '../../io'
import type { DirectiveFamily } from '../../RTD'

export class Development implements DirectiveFamily<Directive> {
  public readonly name: string = 'dev'
  public readonly mandatory: boolean = false

  public create (name: string, value: unknown): Directive {
    const Class = constructors[name]

    if (Class === undefined)
      throw new Error(`Directive 'dev:${name}' is not implemented`)

    return new Class(value)
  }

  public async preflight (directives: Directive[], input: Input): Promise<Output> {
    for (const directive of directives) {
      const output = await directive.apply(input)

      if (output !== null)
        return output
    }

    return null
  }
}

const constructors: Record<string, new (value: any) => Directive> = {
  stub: Stub,
  throw: Throw,
  sleep: Sleep
}
