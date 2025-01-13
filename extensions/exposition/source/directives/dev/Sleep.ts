import assert from 'node:assert'
import { setTimeout } from 'node:timers/promises'
import { console } from 'openspan'
import { cors } from '../cors'
import { BadRequest } from '../../HTTP'
import type { Directive } from './types'
import type { Input, Output } from '../../io'

export class Sleep implements Directive {
  private readonly maximum: number

  public constructor (value: number) {
    assert.ok(Number.isInteger(value), '`dev:sleep` directive value must be an integer')
    console.warn(`Sleep directive is enabled (maximum: ${value}ms)`)

    cors.allow('sleep')
    this.maximum = value
  }

  public async apply (input: Input): Promise<Output> {
    const value = input.request.headers.sleep as string | undefined

    if (value === undefined)
      return null

    const duration = Number.parseInt(value)

    if (Number.isNaN(duration) || duration < 0 || duration > this.maximum)
      throw new BadRequest('Invalid sleep duration')

    await setTimeout(duration)

    return null
  }
}
