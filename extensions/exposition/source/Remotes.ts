import { Locator, Connector, type Component } from '@toa.io/core'
import { type Bootloader } from './Factory'

export class Remotes extends Connector {
  private readonly boot: Bootloader
  private readonly remotes: Record<string, Promise<Component>> = {}

  public constructor (boot: Bootloader) {
    super()
    this.boot = boot
  }

  public async discover (namespace: string, name: string): Promise<Component> {
    const locator = new Locator(name, namespace)

    this.remotes[locator.id] ??= this.create(locator)

    return await this.remotes[locator.id]
  }

  private async create (locator: Locator): Promise<Component> {
    const remote = await this.boot.remote(locator)

    this.depends(remote)

    await remote.connect()

    return remote
  }
}
