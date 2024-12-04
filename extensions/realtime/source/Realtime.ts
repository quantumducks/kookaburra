import { console } from 'openspan'
import { type Component, Connector } from '@toa.io/core'
import { type Routes } from './Routes'

export class Realtime extends Connector {
  private readonly discovery: Promise<Component>
  private streams: Component | null = null

  public constructor (routes: Routes, discovery: Promise<Component>) {
    super()

    this.discovery = discovery

    routes.events.on('data', this.push.bind(this))
  }

  protected override async open (): Promise<void> {
    this.streams = await this.discovery
    this.depends(this.streams)

    await this.streams.connect()

    console.info('Realtime service started')
  }

  protected override dispose (): void {
    console.info('Realtime service shutdown complete')
  }

  private push (event: Event): void {
    void this.streams?.invoke('push', { input: event })
      .catch((error) => console.error('Realtime push failed', error))
  }
}

interface Event {
  key: string
  event: string
  data: string
}
