import * as schemas from './schemas'
import { type Configuration } from './configuration'

export function manifest (manifest: Manifest): Manifest {
  if (manifest.schema === undefined) manifest = { schema: manifest }

  schemas.manifest.validate(manifest)

  return manifest
}

export interface Manifest {
  schema: object
  defaults?: Configuration
}
