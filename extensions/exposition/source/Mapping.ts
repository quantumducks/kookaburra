import { type Parameter } from './RTD'
import { Query } from './Query'
import type * as http from './HTTP'
import type * as syntax from './RTD/syntax'
import type * as core from '@toa.io/core'

export abstract class Mapping {
  public static create (query?: syntax.Query): Mapping {
    if (query === undefined)
      return new InputMapping()

    const q = new Query(query)

    return new QueryableMapping(q)
  }

  public abstract fit (input: any, qs: http.Query, parameters: Parameter[]): core.Request
}

class QueryableMapping extends Mapping {
  private readonly query: Query

  public constructor (query: Query) {
    super()

    this.query = query
  }

  public fit (input: any, qs: http.Query, parameters: Parameter[]): core.Request {
    const query = this.query.fit(qs, parameters)

    return { input, query }
  }
}

class InputMapping extends Mapping {
  public fit (input: any = {}, _: unknown, parameters: Parameter[]): core.Request {
    if (typeof input === 'object')
      this.assign(input, parameters)

    return { input }
  }

  private assign (input: Record<string, any>, parameters: Parameter[]): void {
    for (const parameter of parameters)
      input[parameter.name] = parameter.value
  }
}
