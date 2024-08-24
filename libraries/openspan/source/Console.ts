import { formatters } from './formatters'
import type { Format } from './formatters'

export class Console {
  public readonly debug = this.channel('debug')
  public readonly log = this.debug
  public readonly info = this.channel('info')
  public readonly warn = this.channel('warn')
  public readonly error = this.channel('error')

  private level: Level = LEVELS.debug
  private formatter = formatters.json
  private stdout: NodeJS.WriteStream = process.stdout
  private stderr: NodeJS.WriteStream = process.stderr
  private context?: any

  public constructor (options: ConsoleOptions = {}) {
    this.configure(options)
  }

  public configure (options: ConsoleOptions = {}): void {
    if (options.level !== undefined)
      this.level = typeof options.level === 'string' ? LEVELS[options.level] : options.level

    if (options.format !== undefined)
      this.formatter = formatters[options.format]

    if (options.streams !== undefined) {
      this.stdout = options.streams.stdout
      this.stderr = options.streams.stderr
    }

    if (options.context !== undefined)
      this.context = options.context
  }

  public fork (ctx?: any): Console {
    const options: ConsoleOptions = {
      level: this.level,
      format: this.formatter.name,
      streams: {
        stdout: this.stdout,
        stderr: this.stderr
      }
    }

    const context = this.context === undefined ? ctx : { ...this.context, ...ctx }

    if (context !== undefined)
      options.context = context

    return new Console(options)
  }

  private channel (channel: Channel): Method {
    const level = LEVELS[channel]
    const severity = channel.toUpperCase() as Severity

    return (message: string, attributes?: any, properties?: any) => {
      if (level < this.level)
        return

      const entry: Entry = {
        severity,
        message,
        time: new Date().toISOString()
      }

      if (attributes instanceof Error) {
        entry.attributes = {}

        // @ts-expect-error -- custom error classes
        if (attributes.code !== undefined)
          // @ts-expect-error -- custom error classes
          entry.attributes.code = attributes.code

        if (attributes.message !== undefined)
          entry.attributes.message = attributes.message
      } else if (attributes !== undefined)
        entry.attributes = attributes

      if (this.context !== undefined)
        entry.context = this.context

      if (properties !== undefined)
        Object.assign(entry, properties)

      const buffer = this.formatter.format(entry)

      if (level === LEVELS.error)
        this.stderr.write(buffer)
      else
        this.stdout.write(buffer)
    }
  }
}

export const LEVELS: Record<Channel, Level> = {
  debug: -1,
  info: 0,
  warn: 1,
  error: 2
}

export const console = new Console()

export interface ConsoleOptions {
  level?: Channel | Level
  context?: any
  format?: Format
  streams?: Streams
}

interface Streams {
  stdout: NodeJS.WriteStream
  stderr: NodeJS.WriteStream
}

export interface Entry {
  time: string
  severity: Severity
  message: string
  attributes?: any
  context?: any
}

export type Channel = 'debug' | 'info' | 'warn' | 'error'
export type Severity = Uppercase<Channel>
type Level = -1 | 0 | 1 | 2
type Method = (message: string, attributes?: any, properties?: any) => void
