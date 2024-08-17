import { type Readable } from 'node:stream'
import { dirname, join } from 'node:path'
import fs from 'node:fs/promises'
import { Provider } from '../Provider'
import type { ProviderSecrets } from '../Provider'

export interface FileSystemOptions {
  path: string
  claim?: string
}

export class FileSystem extends Provider<FileSystemOptions> {
  public override readonly path: string

  public constructor (options: FileSystemOptions, secrets?: ProviderSecrets) {
    super(options, secrets)

    this.path = options.path
  }

  public async get (path: string): Promise<Readable | null> {
    try {
      const fd = await fs.open(join(this.path, path))

      return fd.createReadStream()
    } catch (err) {
      if ((err as NodeJS.ErrnoException)?.code === 'ENOENT') return null

      throw err
    }
  }

  public async put (rel: string, filename: string, stream: Readable): Promise<void> {
    const dir = join(this.path, rel)
    const path = join(dir, filename)

    stream.on('error', () => void fs.rm(path, { force: true }))

    await fs.mkdir(dir, { recursive: true })
    await fs.writeFile(path, stream).catch(() => undefined)
  }

  public async delete (path: string): Promise<void> {
    await fs.rm(join(this.path, path), { recursive: true, force: true })
  }

  public async move (from: string, to: string): Promise<void> {
    from = join(this.path, from)
    to = join(this.path, to)

    await fs.mkdir(dirname(to), { recursive: true })
    await fs.rename(from, to)
  }
}
