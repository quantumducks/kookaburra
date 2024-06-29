export interface Service {
  group: string
  name: string
  version: string
  port: number
  ingress: Ingress
  variables: Variable[]
  components?: string[]
  probe?: Probe
}

export interface Variable {
  name: string
  value?: string
  secret?: {
    name: string
    key: string
    optional?: boolean
  }
}

export type Variables = Record<'global' | string, Variable[]>
export type Mounts = Record<'global' | string, Mount[]>

export interface Dependency {
  services?: Service[]
  variables?: Variables
  mounts?: Mounts
}

interface Ingress {
  hosts: string[]
  class?: string
  annotations?: object
}

interface Probe {
  port: number
  path: string
  delay?: number
}

interface Mount {
  name: string
  path: string
  claim: string
}
