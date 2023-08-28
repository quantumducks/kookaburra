import { type Component } from '@toa.io/core'
import { type Parameter } from '../../RTD'
import { type Family, type Input, type Output } from '../../Directive'
import { type Remotes } from '../../Remotes'
import * as http from '../../HTTP'
import { type OutgoingMessage } from '../../HTTP'
import { type Directive, type Identity } from './types'
import { Anonymous } from './Anonymous'
import { Id } from './Id'
import { Role } from './Role'
import { Rule } from './Rule'

class Authorization implements Family<Directive> {
  public readonly name: string = 'auth'
  public readonly mandatory: boolean = true
  private readonly schemes = {} as unknown as Schemes
  private readonly discovery = {} as unknown as Discovery
  private tokens: Component | null = null

  public create (name: string, value: any, remotes: Remotes): Directive {
    const Class = CONSTRUCTORS[name]

    if (Class === undefined)
      throw new Error(`Directive '${name}' is not provided by '${this.name}' family.`)

    this.discovery.basic ??= remotes.discover('identity', 'basic')
    this.discovery.tokens ??= remotes.discover('identity', 'tokens')
    this.discovery.roles ??= remotes.discover('identity', 'roles')

    if (Class === Role) return new Class(value, this.discovery.roles)
    else if (Class === Rule) return new Class(value, this.create.bind(this))
    else return new Class(value)
  }

  public async preflight (directives: Directive[],
    input: Input<Identity | null>,
    parameters: Parameter[]): Promise<Output> {
    const identity = await this.resolve(input.headers.authorization)

    input.identity = identity

    for (const directive of directives) {
      const allow = await directive.authorize(identity, parameters)

      if (allow)
        return null
    }

    if (identity === null) throw new http.Unauthorized()
    else throw new http.Forbidden()
  }

  public async settle (request: Input<Identity | null>,
    response: OutgoingMessage): Promise<void> {
    if (request.identity?.scheme === undefined || request.identity.scheme === PRIMARY)
      return

    const authorization = await this.refresh(request.identity)

    if (response.headers === undefined)
      response.headers = {}

    response.headers.authorization = authorization
  }

  private async resolve (authorization: string | undefined): Promise<Identity | null> {
    if (authorization === undefined)
      return null

    const space = authorization.indexOf(' ')

    if (space === -1)
      throw new http.Unauthorized('Malformed authorization header.')

    const Scheme = authorization.slice(0, space)
    const scheme = Scheme.toLowerCase() as Scheme
    const provider = PROVIDERS[scheme]
    const value = authorization.slice(space + 1)

    if (!(provider in this.discovery))
      throw new http.Unauthorized(`Unknown authentication scheme '${Scheme}'.`)

    this.schemes[scheme] ??= await this.discovery[provider]

    const reply = await this.schemes[scheme].invoke('authenticate', { input: value })

    if (reply.error !== undefined)
      return null

    const identity: Identity = reply.output.identity

    identity.scheme = scheme

    return identity
  }

  private async refresh (identity: Identity): Promise<string> {
    this.tokens ??= await this.discovery.tokens

    if (identity.roles === undefined)
      await Role.set(identity, this.discovery.roles)

    const reply = await this.tokens.invoke('issue', { input: { payload: identity } })

    return `Token ${reply.output}`
  }
}

const CONSTRUCTORS: Record<string, new (value: any, argument?: any) => Directive> = {
  anonymous: Anonymous,
  id: Id,
  role: Role,
  rule: Rule
}

const PROVIDERS: Record<Scheme, Provider> = {
  basic: 'basic',
  token: 'tokens'
}

const PRIMARY: Scheme = 'token'

type Scheme = 'basic' | 'token'
type Provider = 'basic' | 'tokens' | 'roles'
type Discovery = Record<Provider, Promise<Component>>
type Schemes = Record<Scheme, Component>

export = new Authorization()
