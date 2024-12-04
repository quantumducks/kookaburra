import { Forbidden } from '../../HTTP'
import type { Parameter } from '../../RTD'
import type { Context, Directive, Identity, Create } from './types'

export class Input implements Directive {
  public priority = 0
  private readonly statements: Statement[] = []

  public constructor (declarations: Declaration[], create: Create) {
    this.statements = declarations.map((declaration) => new Statement(declaration, create))
  }

  public async authorize
  (identity: Identity | null, context: Context, parameters: Parameter[]): Promise<boolean> {
    context.pipelines.body.push(async (body) => this.check(identity, context, parameters, body))

    return false
  }

  // eslint-disable-next-line max-params
  private async check (identity: Identity | null, context: Context, parameters: Parameter[], body: unknown): Promise<unknown> {
    if (body === undefined || body === null || body.constructor !== Object)
      return body

    const settled = await Promise.allSettled(this.statements.map(async (statement) =>
      statement.check(identity, context, parameters, body as Body)))

    for (const result of settled)
      if (result.status === 'rejected')
        throw result.reason

    return body
  }
}

class Statement {
  private readonly properties: string[]
  private readonly directives: Directive[] = []

  public constructor ({ prop, ...directives }: Declaration, create: Create) {
    this.properties = typeof prop === 'string' ? [prop] : prop

    for (const [name, value] of Object.entries(directives)) {
      const directive = create(name, value)

      this.directives.push(directive)
    }
  }

  // eslint-disable-next-line max-params
  public async check (identity: Identity | null, context: Context, parameters: Parameter[], body: Body): Promise<void> {
    const match = this.properties.some((property) => property in body)

    if (!match)
      return

    for (const directive of this.directives) {
      const authorized = await directive.authorize(identity, context, parameters)

      if (!authorized)
        throw new Forbidden('Input property is not authorized')
    }
  }
}

export interface Declaration {
  [key: Exclude<string, 'prop'>]: unknown

  prop: string | string[]
}

type Body = Record<string, unknown>
