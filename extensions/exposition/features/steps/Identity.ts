import { binding, given } from 'cucumber-tsflow'
import * as http from '@toa.io/agent'
import { Parameters } from './Parameters'
import { Captures } from './Captures'
import { Gateway } from './Gateway'

@binding([Gateway, Parameters, Captures])
export class Identity {
  private readonly gateway: Gateway
  private readonly http: http.Agent
  private readonly variables: Captures

  public constructor (gateway: Gateway, parameters: Parameters, captures: Captures) {
    this.gateway = gateway
    this.http = new http.Agent(parameters.origin, captures)
    this.variables = captures
  }

  @given('transient identity {word}')
  public async transient (as: string): Promise<Principal> {
    await this.gateway.start()

    await this.http.request(`
      GET /identity/ HTTP/1.1
      host: nex.toa.io
      accept: application/yaml
    `)

    this.http.responseIncludes(`
      201 Created
      authorization: Token \${{ ${as}.token }}

      id: \${{ ${as}.id }}
    `)

    const id = this.variables.get(as + '.id')!
    const token = this.variables.get(as + '.token')!

    return { id, token }
  }

  @given('transient identity')
  public async anonymous (): Promise<Principal> {
    return await this.transient('identity')
  }
}

export interface Principal {
  id: string
  token: string
}
