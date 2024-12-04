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
        console.error('Event does not contain the expected property',
          { property, event: this.event })

        return
      }

      if (Array.isArray(key))
        // eslint-disable-next-line max-depth
        for (const k of key)
          this.stream.push({ key: k, event: this.event, data: message.payload })
      else
        this.stream.push({ key, event: this.event, data: message.payload })
    }
  }
}
