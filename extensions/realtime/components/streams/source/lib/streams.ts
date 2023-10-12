import { PassThrough, Readable } from 'node:stream'

export function addStream (key: string, map: Record<string, Stream>): void {
  const stream = new Stream()

  map[key] = stream

  stream.once('close', () => delete map[key])
}

export class Stream extends Readable {
  private forks: number = 0

  public constructor () {
    super(objectMode)
  }

  public fork (): PassThrough {
    const through = new PassThrough(objectMode)

    through.once('close', this.decrement.bind(this))

    this.increment()
    this.pipe(through)

    return through
  }

  // has to be here
  public override _read (): void {
  }

  private increment (): void {
    this.forks++
  }

  private decrement (): void {
    this.forks--

    if (this.forks === 0)
      this.destroy()
  }
}

const objectMode = { objectMode: true }
