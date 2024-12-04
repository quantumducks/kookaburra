import { posix } from 'node:path'
import { match } from 'matchacho'
import { Execution } from './Execution'
import type { Entry } from '@toa.io/extensions.storages'
import type { Context } from './Execution'
import type { Parameter } from '../../../RTD'
import type { Remotes } from '../../../Remotes'

export class Workflow {
  private readonly units: Unit[]
  private readonly remotes: Remotes

  public constructor (units: Unit[] | Unit, remotes: Remotes) {
    this.units = match<Unit[]>(units,
      Array, (units: Unit[]) => units,
      Object, (unit: Unit) => [unit])

    this.remotes = remotes
  }

  public execute (location: Location, entry: Entry, params: Parameter[]): Execution {
    const parameters: Record<string, string> = {}

    for (const { name, value } of params)
      parameters[name] = value

    const context: Context = {
      authority: location.authority,
      identity: location.identity,
      storage: location.storage,
      path: posix.join(location.path, entry.id),
      entry,
      parameters
    }

    return new Execution(context, this.units, this.remotes)
  }
}

export interface Location {
  authority: string
  identity?: string
  storage: string
  path: string
}

export type Unit = Record<string, string>
