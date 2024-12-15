import assert from 'node:assert'
import Negotiator from 'negotiator'
import { cors } from '../cors'
import { Mapping } from './Mapping'
import { Languages } from './Languages'
import type { Input } from '../../io'
import type { Parameter } from '../../RTD'
import type { Directive } from './Directive'

export class Language extends Mapping<string> {
  private languages: string[] | null = null

  public constructor (property: string) {
    assert.ok(typeof property === 'string', '`map:language` must be a string')

    cors.allow('accept-language')
    super(property)
  }

  public properties (context: Input, parameters: Parameter[], directives: Directive[]): Record<string, string> {
    this.languages ??= this.resolve(directives)

    const negotiator = new Negotiator(context.request)
    const language = negotiator.language(this.languages) ?? this.languages[0]

    context.pipelines.response.push((response) => {
      response.headers ??= new Headers()
      response.headers.set('content-language', language)
      response.headers.append('vary', 'accept-language')
    })

    return { [this.value]: language }
  }

  private resolve (directives: Directive[]): string[] {
    for (const directive of directives)
      if (directive instanceof Languages)
        return directive.value

    throw new Error('Supported languages are not defined, add `map:languages` directive')
  }
}
