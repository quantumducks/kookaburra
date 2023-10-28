import { types } from './formats'

export class Exception extends Error {
  public readonly status: number
  public readonly body?: any

  protected constructor (status: number, body?: any) {
    super()
    this.status = status
    this.body = body
  }
}

export class ClientError extends Exception {
}

export class BadRequest extends ClientError {
  public constructor (body?: any) {
    super(400, body)
  }
}

export class Unauthorized extends ClientError {
  public constructor (body?: any) {
    super(401, body)
  }
}

export class Forbidden extends ClientError {
  public constructor (body?: any) {
    super(403, body)
  }
}

export class NotFound extends ClientError {
  public constructor (body?: any) {
    super(404, body)
  }
}

export class Conflict extends ClientError {
  public constructor (body: any) {
    super(409, body)
  }
}

export class MethodNotAllowed extends ClientError {
  public constructor () {
    super(405)
  }
}

class MediaTypeException extends ClientError {
  private static readonly message = 'Supported media types:\n- ' + types.join('\n- ')

  protected constructor (status: number) {
    super(status, MediaTypeException.message)
  }
}

export class NotAcceptable extends MediaTypeException {
  public constructor () {
    super(406)
  }
}

export class UnsupportedMediaType extends MediaTypeException {
  public constructor () {
    super(415)
  }
}

export class PreconditionFailed extends ClientError {
  public constructor () {
    super(412)
  }
}
