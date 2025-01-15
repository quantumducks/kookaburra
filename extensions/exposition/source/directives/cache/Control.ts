import { match } from 'matchacho'
import type { AuthenticatedContext, Directive } from './types'

export class Control implements Directive {
  protected readonly value: string
  private control: string | null = null
  private vary: boolean = false

  public constructor (value: string) {
    this.value = value
  }

  public static disabled (headers: Headers): boolean {
    const value = headers.get('cache-control')

    if (value === null)
      return false

    const directives = mask(value)

    return (directives & NO_STORE) === NO_STORE
  }

  public set (context: AuthenticatedContext, headers: Headers): void {
    if (!['GET', 'HEAD', 'OPTIONS'].includes(context.request.method))
      return

    this.control ??= this.resolve(context)

    if (Control.disabled(headers))
      return

    headers.set('cache-control', this.control)

    if (this.vary)
      headers.append('vary', 'authorization')
  }

  protected resolve (request: AuthenticatedContext): string {
    if (request.identity === null)
      return this.value

    const directives = mask(this.value)

    if ((directives & PRIVATE) === PRIVATE)
      this.vary = true

    if ((directives & (PUBLIC | NO_CACHE)) === PUBLIC)
      return 'no-cache, ' + this.value

    if ((directives & (PUBLIC | PRIVATE)) === 0) {
      this.vary = true

      return 'private, ' + this.value
    }

    return this.value
  }
}

function mask (value: string): number {
  const directives = value.match(DIRECTIVES_RX)

  if (directives === null)
    return 0

  let mask = 0

  for (const directive of directives)
    mask |= match<number>(directive,
      'private', PRIVATE,
      'public', PUBLIC,
      'no-cache', NO_CACHE,
      'no-store', NO_STORE,
      0)

  return mask
}

const DIRECTIVES_RX = /\b(private|public|no-cache|no-store)\b/ig

const PUBLIC = 1
const PRIVATE = 2
const NO_CACHE = 4
const NO_STORE = 8
