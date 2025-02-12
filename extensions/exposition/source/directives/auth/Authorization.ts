import assert from 'node:assert'
import { match } from 'matchacho'
import { console } from 'openspan'
import { minimatch } from 'minimatch'
import * as http from '../../HTTP'
import { Anonymous } from './Anonymous'
import { Id } from './Id'
import { Role } from './Role'
import { Rule } from './Rule'
import { Incept } from './Incept'
import { Issue } from './Issue'
import { Echo } from './Echo'
import { Scheme } from './Scheme'
import { Delegate } from './Delegate'
import { Federation } from './Federation'
import { Anyone } from './Anyone'
import { Input, type Declaration } from './Input'
import { split } from './split'
import { PRIMARY, PROVIDERS } from './schemes'
import type { Output } from '../../io'
import type { Component } from '@toa.io/core'
import type { Remotes } from '../../Remotes'
import type { Parameter, DirectiveFamily } from '../../RTD'
import type {
  AuthenticationResult,
  Ban,
  Directive,
  Discovery,
  Extension,
  Identity,
  Context,
  Remote,
  Schemes
} from './types'

export class Authorization implements DirectiveFamily<Directive, Extension> {
  public readonly depends: string[] = ['Vary']
  public readonly name: string = 'auth'
  public readonly mandatory: boolean = true

  private readonly schemes = {} as unknown as Schemes
  private readonly discovery = {} as unknown as Discovery
  private tokens: Component | null = null
  private bans: Component | null = null

  public create (name: string, value: any, remotes: Remotes): Directive {
    assert.ok(name in constructors,
      `Directive 'auth:${name}' is not implemented`)

    const Class = constructors[name]

    for (const name of REMOTES)
      this.discovery[name] ??= remotes.discover('identity', name)

    return match(Class,
      Role, () => new Role(value as string | string[], this.discovery.roles),
      Rule, () => new Rule(value as Record<string, string>, this.create.bind(this)),
      Input, () => new Input(value as Declaration[], this.create.bind(this)),
      Incept, () => new Incept(value as string, this.discovery),
      Delegate, () => new Delegate(value as string, this.discovery.roles),
      () => new Class(value))
  }

  public async preflight (directives: Directive[],
    context: Context,
    parameters: Parameter[]): Promise<Output> {
    context.identity = await this.resolve(context.authority, context.request.headers.authorization)
    directives.sort((a, b) => (a.priority ?? 1) - (b.priority ?? 1))

    for (const directive of directives) {
      const allow = await directive.authorize(context.identity, context, parameters)

      if (allow)
        if (this.permitted(context))
          return directive.reply?.(context) ?? null
        else
          throw new http.Forbidden()
    }

    if (context.identity === null)
      throw new http.Unauthorized()
    else
      throw new http.Forbidden()
  }

  public async settle (directives: Directive[],
    context: Context,
    response: http.OutgoingMessage): Promise<void> {
    await Promise.all(directives.map(async (directive) =>
      directive.settle?.(context, response)))

    const identity = context.identity

    if (identity === null)
      return

    if (identity.scheme === PRIMARY && !identity.refresh)
      return

    // Role directive may have already set the value
    identity.roles ??= await Role.get(identity, this.discovery.roles)
    this.tokens ??= await this.discovery.tokens

    const token = await this.tokens.invoke<string>('encrypt', {
      input: { authority: context.authority, identity }
    })

    const authorization = `Token ${token}`

    response.headers ??= new Headers()
    response.headers.set('authorization', authorization)
    response.headers.set('cache-control', 'no-store')
  }

  private async resolve (authority: string, authorization: string | undefined): Promise<Identity | null> {
    if (authorization === undefined)
      return null

    const [scheme, credentials] = split(authorization)
    const provider = PROVIDERS[scheme]

    if (!(provider in this.discovery))
      throw new http.Unauthorized(`Unknown authentication scheme '${scheme}'`)

    this.schemes[scheme] ??= await this.discovery[provider]

    const result = await this.schemes[scheme].invoke<AuthenticationResult>('authenticate', {
      input: {
        authority,
        credentials
      }
    })

    if (result instanceof Error) {
      const code: string | unknown = (result as unknown as { code: string }).code

      if (typeof code === 'string')
        console.info('Authentication failed', { code })

      return null
    }

    const identity = result.identity

    if (scheme !== PRIMARY && (await this.banned(identity))) throw new http.Unauthorized()

    identity.scheme = scheme
    identity.refresh = result.refresh

    return identity
  }

  private permitted (context: Context): boolean {
    const permissions = context.identity?.permissions

    if (permissions === undefined)
      return true

    return Object.entries(permissions).some(([pattern, methods]) => {
      return methods.some((method) => method === '*' || method === context.request.method) &&
        minimatch(context.request.url, pattern)
    })
  }

  private async banned (identity: Identity): Promise<boolean> {
    this.bans ??= await this.discovery.bans

    const ban = await this.bans.invoke<Ban>('observe', { query: { id: identity.id } })

    return ban.banned
  }
}

const constructors: Record<string, new (value: any, argument?: any) => Directive> = {
  anonymous: Anonymous,
  anyone: Anyone,
  id: Id,
  role: Role,
  rule: Rule,
  incept: Incept,
  issue: Issue,
  scheme: Scheme,
  echo: Echo,
  delegate: Delegate,
  claims: Federation,
  input: Input
}

const REMOTES: Remote[] = ['basic', 'federation', 'tokens', 'roles', 'bans']
