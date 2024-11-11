import { basename, dirname, join } from 'node:path'
import { Readable } from 'node:stream'
import { v2 as cloudinary } from 'cloudinary'
import { console } from 'openspan'
import { Provider } from '../Provider'
import { ERR_NOT_FOUND } from '../errors'
import type { Maybe } from '@toa.io/types'
import type { Metadata, Stream } from '../Entry'
import type { Secret, Secrets } from '../Secrets'
import type { ReadableStream } from 'node:stream/web'
import type {
  ConfigOptions,
  ImageTransformationOptions,
  VideoTransformationOptions
} from 'cloudinary'

export type CloudinarySecrets = Secrets<'API_KEY' | 'API_SECRET'>

export class Cloudinary extends Provider<CloudinaryOptions> {
  public static override readonly SECRETS: readonly Secret[] = [
    { name: 'API_KEY' },
    { name: 'API_SECRET' }
  ]

  private readonly type: StorageType
  private readonly transformations: Transformation[] = []
  private readonly config: ConfigOptions
  private readonly prefix: string

  public constructor (options: CloudinaryOptions, secrets?: CloudinarySecrets) {
    super(options, secrets)

    this.type = options.type

    if (options.transformations !== undefined)
      this.transformations = options.transformations.map((transformation) => {
        const { extension, ...rest } = transformation

        let expression = extension

        if (!extension.startsWith('^'))
          expression = '^' + extension

        if (!extension.endsWith('$'))
          expression = extension + '$'

        return {
          extension: new RegExp(expression),
          ...rest
        }
      })

    this.config = {
      cloud_name: options.environment,
      api_key: secrets!.API_KEY,
      api_secret: secrets!.API_SECRET
    }

    this.prefix = options.prefix ?? '/'
  }

  public async get (path: string): Promise<Maybe<Stream>> {
    const response = await this.fetch(path)

    if (response instanceof Error)
      return ERR_NOT_FOUND

    const metadata = this.metadata(response)

    return {
      stream: Readable.fromWeb(response.body as ReadableStream),
      ...metadata
    }
  }

  public async head (path: string): Promise<Maybe<Metadata>> {
    const response = await this.fetch(path, 'HEAD')

    if (response instanceof Error)
      return ERR_NOT_FOUND

    return this.metadata(response)
  }

  public async put (path: string, stream: Readable): Promise<void> {
    const id = basename(path)
    const folder = join(this.prefix, dirname(path))

    console.debug('Uploading to Cloudinary', { path })

    await new Promise((resolve, reject) => {
      stream.pipe(this.cloudinary().uploader.upload_stream({
        public_id: id,
        folder,
        resource_type: 'auto',
        overwrite: true,
        invalidate: true
      },
      (error, result) => {
        if (error !== undefined) reject(error)
        else resolve(result)
      }))

      stream.on('error', reject)
    })
  }

  public async commit (): Promise<void> {
    // metadata is read-only
  }

  public async delete (path: string): Promise<void> {
    const id = join(this.prefix, path)

    console.debug('Deleting from Cloudinary', { path: id })

    await this.cloudinary().uploader.destroy(id,
      { resource_type: this.type, invalidate: true })
  }

  public async move (from: string, to: string): Promise<void | Error> {
    const source = join(this.prefix, from)
    const target = join(this.prefix, to)

    try {
      await this.cloudinary().uploader.rename(source, target,
        { resource_type: this.type, overwrite: true })
    } catch (error: any) {
      if (error.http_code === 404)
        return ERR_NOT_FOUND
      else
        throw error
    }
  }

  private async fetch (path: string, method = 'GET'): Promise<Maybe<Response>> {
    const url = this.url(path)

    if (url === null)
      return ERR_NOT_FOUND

    console.debug('Fetching from Cloudinary', {
      method,
      path,
      url
    })

    const response = await fetch(url, { method }).catch((e) => e)

    if (response instanceof Error || response.ok === false) {
      console.debug('Failed to fetch from Cloudinary', {
        url,
        message: response.message
      })

      return ERR_NOT_FOUND
    }

    return response
  }

  private url (path: string): string | null {
    const [base, transformation] = this.toTransformation(path)

    if (base === null)
      return null

    const id = join(this.prefix, base)

    return this.cloudinary().url(id, {
      resource_type: this.type,
      transformation,
      version: 2
    })
  }

  private toTransformation (path: string): [string | null, TransformationOptions[] | undefined] {
    if (this.transformations.length === 0)
      return [path, undefined]

    const [base, ...extensions] = path.split('.')
    const transformations: TransformationOptions[] = []

    let t = 0

    for (const extension of extensions) {
      let found = false

      for (t; t < this.transformations.length && !found; t++) {
        const { extension: regex, transformation: options, optional } = this.transformations[t]

        const match = regex.exec(extension)

        // eslint-disable-next-line max-depth
        if (match === null)
          if (optional === true)
            continue
          else
            return [null, undefined]

        const transformation = Object.fromEntries(Object.entries(options).map(([key, value]) => {
          if (typeof value !== 'string')
            return [key, value]

          if (value.startsWith('<') && value.endsWith('>'))
            value = match.groups![value.slice(1, -1)]

          if (key === 'zoom' && value !== undefined)
            value = Number.parseInt(value as string) / 100

          if (key === 'fetch_format' && value === 'jpeg')
            value = 'jpg'

          return [key, value]
        }))

        transformations.push(transformation)
        found = true
      }

      if (!found)
        return [null, undefined]
    }

    for (t; t < this.transformations.length; t++)
      if (this.transformations[t].optional !== true)
        return [null, undefined]

    return [base, transformations]
  }

  private metadata (response: Response): Metadata {
    const size = response.headers.get('content-length') === null
      ? 0
      : Number.parseInt(response.headers.get('content-length')!)

    const created = response.headers.get('date') ?? new Date().toISOString()
    const etag = response.headers.get('etag')
    const checksum = etag === null ? basename(response.url) : etag.slice(1, -1)

    return {
      type: response.headers.get('content-type')!,
      size,
      checksum,
      created,
      attributes: {}
    }
  }

  private cloudinary (): typeof cloudinary {
    cloudinary.config(this.config)

    return cloudinary
  }
}

export interface CloudinaryOptions {
  environment: string
  type: StorageType
  prefix?: string
  transformations?: TransformationDeclaration[]
}

type TransformationDeclaration = Omit<Transformation, 'extension'> & { extension: string }

interface Transformation {
  extension: RegExp
  transformation: object
  optional?: boolean
}

type TransformationOptions = ImageTransformationOptions | VideoTransformationOptions

type StorageType = 'image' | 'video'
