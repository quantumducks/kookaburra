import { readdirSync, type Dirent } from 'node:fs'
import { resolve } from 'node:path'
import { Connector } from '@toa.io/core'
import { type Bootloader } from './Factory'

export class Composition extends Connector {
  private readonly boot: Bootloader

  public constructor (boot: Bootloader) {
    super()
    this.boot = boot
  }

  protected override async open (): Promise<void> {
    const paths = find()
    const composition = await this.boot.composition(paths)

    await composition.connect()

    this.depends(composition)
  }
}

function find (): string[] {
  return entries().map((entry) => resolve(ROOT, entry.name))
}

function entries (): Dirent[] {
  const entries = readdirSync(ROOT, { withFileTypes: true })

  return entries.filter((entry) => entry.isDirectory())
}

const ROOT = resolve(__dirname, '../components/')
