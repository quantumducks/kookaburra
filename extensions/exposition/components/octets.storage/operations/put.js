'use strict'

const { Readable } = require('node:stream')
const { posix } = require('node:path')
const { Err } = require('error-value')
const { match } = require('matchacho')

async function put (input, context) {
  const { storage, request, location, accept, limit, trust } = input
  const url = request.url
  const id = request.headers['content-id']
  const claim = request.headers['content-type']
  const attributes = parseAttributes(request.headers['content-attributes'])
  const reference = request.headers['content-location']

  /** @type {Readable} */
  let body = request

  const options = { claim, accept, attributes }

  if (id !== undefined) {
    if (!ID_RX.test(id))
      return ERR_INVALID_ID

    options.id = id
  }

  if (reference !== undefined) {
    const length = Number.parseInt(request.headers['content-length'])

    if (length !== 0)
      return ERR_LENGTH

    if (!trusted(reference, trust))
      return ERR_UNTRUSTED

    body = await download(reference)

    if (body instanceof Error)
      return body

    options.origin = reference
  }

  if (limit !== undefined)
    options.limit = limit

  const path = posix.resolve(url, location ?? '.')

  return context.storages[storage].put(path, body, options)
}

/**
 * @param {string | string[] | undefined} values
 * @returns {Record<string, string>}
 */
function parseAttributes (values) {
  const attributes = {}

  if (values === undefined)
    return attributes

  if (typeof values === 'string')
    values = values.split(',')

  for (const pair of values) {
    const eq = pair.indexOf('=')
    const key = (eq === -1 ? pair : pair.slice(0, eq)).trim()

    attributes[key] = eq === -1 ? 'true' : pair.slice(eq + 1).trim()
  }

  return attributes
}

/**
 * @param {string} location
 * @return {Readable | Error}
 */
async function download (location) {
  const response = await fetch(location)

  if (!response.ok)
    return ERR_UNAVAILABLE

  return response.body === null ? ERR_UNAVAILABLE : Readable.fromWeb(
    /** @type {import('node:stream/web').ReadableStream} **/ response.body)

}

/**
 * @param {string} location
 * @param {Trust | undefined} trust
 * @return {boolean}
 */
function trusted (location, trust) {
  if (trust === undefined)
    return false

  const url = toURL(location)

  if (url === null)
    return false

  for (const permission of trust) {
    const ok = match(permission,
      String, (origin) => url.origin === origin,
      RegExp, (pattern) => pattern.test(url.origin))

    if (ok)
      return true
  }

  return false
}

function toURL (location) {
  try {
    return new URL(location)
  } catch (error) {
    return null
  }
}

const ERR_UNTRUSTED = new Err('LOCATION_UNTRUSTED', 'Location is not trusted')
const ERR_LENGTH = new Err('LOCATION_LENGTH', 'Content-Length must be 0 when Content-Location is used')
const ERR_UNAVAILABLE = new Err('LOCATION_UNAVAILABLE', 'Location is not available')
const ERR_INVALID_ID = new Err('INVALID_ID', 'Invalid Content-ID')

const ID_RX = /^[a-zA-Z0-9-_]{1,32}$/

exports.effect = put

/** @typedef {Array<string | RegExp>} Trust */
/** @typedef {import('node:stream').Readable} Readable */
