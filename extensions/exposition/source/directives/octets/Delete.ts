import { Readable } from 'stream'
import { NotFound } from '../../HTTP'
import * as schemas from './schemas'
import { Workflow } from './workflows'
import { Directive } from './Directive'
import type { Parameter } from '../../RTD'
import type { Unit, Location } from './workflows'
import type { Maybe } from '@toa.io/types'
import type { Component } from '@toa.io/core'
import type { Output } from '../../io'
import type { Input } from './types'
import type { Remotes } from '../../Remotes'
import type { Entry } from '@toa.io/extensions.storages'

export class Delete extends Directive {
  public readonly targeted = true

  private readonly workflow?: Workflow
  private readonly discovery: Promise<Component>
  private storage!: Component

  public constructor (options: Options | null, discovery: Promise<Component>, remotes: Remotes) {
    super()
    schemas.remove.validate(options)

    if (options?.workflow !== undefined)
      this.workflow = new Workflow(options.workflow, remotes)

    this.discovery = discovery
  }

  public async apply (storage: string, input: Input, parameters: Parameter[]): Promise<Output> {
    this.storage ??= await this.discovery

    const output: Output = {}

    if (this.workflow !== undefined) {
      const entry = await this.storage.invoke<Maybe<Entry>>('head',
        {
          input: {
            storage,
            path: input.request.url
          }
        })

      if (entry instanceof Error)
        throw new NotFound()

      output.status = 202
      output.body = Readable.from(this.execute(input, storage, entry, parameters))
    } else
      await this.delete(storage, input)

    return output
  }

  private async delete (storage: string, input: Input): Promise<void> {
    await this.storage.invoke('delete',
      {
        input: {
          storage,
          path: input.request.url
        }
      })
  }

  // eslint-disable-next-line max-params
  private async * execute
  (input: Input, storage: string, entry: Entry, parameters: Parameter[]): AsyncGenerator {
    const location: Location = {
      storage,
      authority: input.authority,
      path: input.request.url
    }

    for await (const chunk of this.workflow!.execute(location, entry, parameters)) {
      yield chunk

      if (typeof chunk === 'object' && chunk !== null && 'error' in chunk)
        return
    }

    await this.delete(storage, input)
  }
}

export interface Options {
  workflow?: Unit[] | Unit
}
