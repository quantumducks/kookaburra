import { type Request, type Reply } from '@toa.io/core'
import { type Endpoint } from './Endpoint'
import type * as syntax from './syntax'

export abstract class Method {
  private readonly endpoint: Endpoint

  public constructor (endpoint: Endpoint) {
    this.endpoint = endpoint
  }

  public async call (body: any, params: Record<string, string>): Promise<Reply> {
    const request = this.request(body, params)

    return await this.endpoint.call(request)
  }

  protected abstract request (body: any, params: Record<string, string>): Request
}

export class InputMethod extends Method {
  protected override request (body: any, params: Record<string, string>): Request {
    return { input: body }
  }
}

export class QueryMethod extends Method {
  protected override request (body: any, params: Record<string, string>): Request {
    return {}
  }
}

export type Methods = Map<syntax.Method, Method>
