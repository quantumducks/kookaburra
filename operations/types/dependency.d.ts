export type Service = {
  group: string
  name: string
  version: string
  port: number
  ingress?: {
    host: string
    class?: string
    annotations?: object
  }
  variables: Variable[]
  components?: string[]
}

export type Variable = {
  name: string
  value?: string
  secret?: {
    name: string,
    key: string
  }
}

export type Variables = Record<string, Variable[]>

export type Dependency = {
  services?: Service[]
  variables?: Variables
}
