export interface Request<Input = unknown, Entity = unknown> {
  input?: Input
  query?: Query<Entity>
  entity?: Entity
  task?: boolean
}

export interface Query<Entity = unknown> {
  id?: string
  version?: number
  criteria?: string
  omit?: number
  limit?: number
  sort?: string[]
  projection?: Array<keyof Entity>
}

export type Maybe<T> = T | Error
export type Call<Output = any, Input = any> = (request: Request<Input>) => Promise<Output>
export type Observation<Output = any, Input = never, Entity = unknown> = (request: Request<Input, Entity>) => Promise<Output extends Array<unknown> ? Output : Output | null>
export type Transition<Output = any, Input = never, Entity = unknown> = (request: Request<Input, Entity>) => Promise<Output | null>
