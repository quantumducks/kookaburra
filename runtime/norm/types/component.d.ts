import type { Locator, operations } from '@toa.io/core'

type Map = {
  [id: string]: Component
}

export type Operation = {
  type: operations.type
  scope?: operations.scope
  bindings?: string[]
  input?: any
  output?: any
  error?: any
  query?: boolean
}

export type Operations = Record<string, Operation>

type Event = {
  binding: string
}

type Events = {
  [key: string]: Event
}

type Receiver = {
  operation: string
  adaptive: boolean
  conditioned: boolean
  bridge: string
  binding: string
  path: string
  source?: string
}

type Entity = {
  schema: Object
  storage?: string
  dependent?: boolean
}

type Declaration = {
  prototype?: string
  namespace: string
  name: string
  version: string
  entity?: Entity
  bindings?: string[]
  operations: Operations
  events?: Events
  receivers?: Record<string, Receiver>
  extensions?: Record<string, object>
  properties?: Record<string, object>
}

export type Manifest = Declaration & {
  locator: Locator
  path: string
}
