// noinspection ES6UnusedImports

import type * as declarations from './declarations'

declare namespace toa.extensions.exposition {

  namespace remotes {

        type Factory = (namespace: string, name: string) => Promise<Remote>

  }

  interface Remote {
    update(declaration: declarations.Node): void
  }

}

export type Remote = toa.extensions.exposition.Remote
