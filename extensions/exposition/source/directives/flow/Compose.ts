import { once } from 'node:events'
import * as assert from 'node:assert'
import { Readable } from 'node:stream'
import { console } from 'openspan'
import type { Directive } from './types'
import type { Input as Context } from '../../io'
import type { OutgoingMessage } from '../../HTTP'

export class Compose implements Directive {
  private readonly expressions: Expression[]

  public constructor (composition: any) {
    this.expressions = build(composition)
  }

  public attach (context: Context): void {
    context.pipelines.response.push(async (message: OutgoingMessage) => {
      if (!(message.body instanceof Readable)) {
        console.warn('Response body is not a stream, skipping composition')

        return
      }

      assert.ok(message.body instanceof Readable, 'Response body is not a stream')

      // @ts-expect-error -- objectMode is not defined in the type definition
      assert.ok(message.body._readableState.objectMode, 'Response stream is not in object mode')

      const $ = await this.compose(message.body)

      message.body = this.execute($)
    })
  }

  private async compose (stream: Readable): Promise<unknown[]> {
    const $: unknown[] = []

    stream.on('data', (data) => $.push(data))

    await once(stream, 'end')

    return $
  }

  private execute ($: unknown[]): unknown {
    let exception: Error | undefined

    for (const expression of this.expressions)
      try {
        return expression($)
      } catch (e: unknown) {
        exception = e as Error
        console.debug('Chunks composition failed', { cause: exception.message })
      }

    throw exception!
  }
}

function build (composition: any): Expression[] {
  return Array.isArray(composition)
    ? composition.map((variant) => compile(variant))
    : [compile(composition)]
}

function compile (composition: object | string): Expression {
  const text = typeof composition === 'string'
    ? `return ${composition}`
    : `return ${json(composition)}`

  // eslint-disable-next-line @typescript-eslint/no-implied-eval,no-new-func
  return new Function('$', text) as Expression
}

function json (node: object | string): string {
  if (typeof node === 'string')
    if (node.startsWith('\\'))
      return `"${node}"`
    else
      return node

  if (Array.isArray(node))
    return `[${node.map((v) => json(v as object | string)).join(',')}]`

  if (node.constructor !== Object)
    return JSON.stringify(node)

  return '{' + Object.entries(node)
    .map(([key, value]) => `"${key}": ${json(value as object | string)}`).join(',') + '}'
}

type Expression = ($: unknown[]) => unknown
