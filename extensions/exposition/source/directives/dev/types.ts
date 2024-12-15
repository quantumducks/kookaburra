import type { Input, Output } from '../../io'

export interface Directive {
  apply: (input: Input) => Promise<Output> | Output
}
