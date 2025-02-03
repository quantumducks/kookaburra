export interface Request<Input = unknown, Entity = unknown> {
  input?: Input
  query?: Query
  entity?: Entity
  task?: boolean
}

export interface Query {
  id?: string
  version?: number
  criteria?: string
  omit?: number
  limit?: number
  sort?: string[]
  projection?: string[]
}

export type Maybe<T> = T | Error
export type Call<Output = any, Input = any> = (request: Request<Input>) => Promise<Output>
export type Observation<Output = any, Input = undefined> = (request: Request<Input>) => Promise<Output extends Array<unknown> ? Output : Output | null>
export type Transition<Output = any, Input = undefined> = (request: Request<Input>) => Promise<Output | null>
