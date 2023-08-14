import { Readable } from 'stream'

export function flip (): boolean

export function plain (candidate: any): boolean

export async function timeout (ms: number): Promise<void>

export async function immediate (): Promise<void>

export function trim (input: string): string

export async function buffer (stream: Readable): Promise<Buffer>

export function traverse (object: object, visit: (node: object) => object): object

export function shards (input: string): string[]

export function echo (input: string): string
export function echo (input: string, values: Record<string, string>): string
export function echo (input: string, ...values: string[]): string

export function encode (input: any): string

export function decode (input: string): any

export function memo<T> (fn: T): T

export { promex } from './promex'
export { merge, add, overwrite } from './merge'
export { map } from './map'
