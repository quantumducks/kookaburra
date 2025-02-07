import { console } from 'openspan'
import { Connector, type Message } from '@toa.io/core'
import type { Readable } from 'node:stream'

export class Receiver extends Connector {
  private readonly event: string
  private readonly properties: string[]
  private readonly stream: Readable

  public constructor (event: string, properties: string[], stream: Readable) {
    super()

    this.event = event
    this.properties = properties
    this.stream = stream
  }

  public receive (message: Message<Record<string, string>>): void {
    for (const property of this.properties) {
      const key = message.payload[property]

      if (key === undefined) {
        console.debug('Event does not contain key property',
          { property, event: this.event })

        continue
      }

      if (Array.isArray(key))
        // eslint-disable-next-line max-depth
        for (const k of key)
          this.push(k, message.payload)
      else
        this.push(key, message.payload)
    }
  }

  private push (key: string, data: Record<string, string>): void {
    console.debug('Pushing event to stream', { key, event: this.event, data })

    this.stream.push({ key, event: this.event, data })
  }
}
