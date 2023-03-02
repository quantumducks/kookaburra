'use strict'

const { generate } = require('randomstring')
const { promex } = require('@toa.io/libraries/generic')

const mock = require('./connection.mock')
const { IO } = require('../src/io')
const { randomBytes } = require('crypto')

/** @type {comq.IO} */
let io

/** @type {jest.MockedObject<comq.Connection>} */
let connection

/** @type {jest.MockedObject<comq.Channel>} */
let requests

/** @type {jest.MockedObject<comq.Channel>} */
let events

beforeEach(async () => {
  jest.clearAllMocks()

  requests = undefined
  events = undefined

  connection = mock.connection()
  io = new IO(connection)
})

describe('seal', () => {
  it('should be', async () => {
    expect(io.seal).toBeDefined()
  })

  it('should seal requests and events channels', async () => {
    await reply()
    await io.close()

    expect(requests.seal).toHaveBeenCalled()
    expect(events.seal).toHaveBeenCalled()
  })

  it('should not throw if channels haven\'t been initialized', async () => {
    await expect(io.seal()).resolves.not.toThrow()
  })

  it('should not seal channel twice', async () => {
    await reply()
    await io.seal()
    await io.close()

    expect(requests.seal).toHaveBeenCalledTimes(1)
    expect(events.seal).toHaveBeenCalledTimes(1)
  })
})

describe('close', () => {
  it('should seal requests and events channels', async () => {
    await reply()
    await io.close()

    expect(requests.seal).toHaveBeenCalled()
    expect(events.seal).toHaveBeenCalled()
  })

  it('should not throw if channels haven\'t been initialized', async () => {
    await expect(io.close()).resolves.not.toThrow()
  })

  it('should wait for event processing completion', async () => {
    const promise = /** @type {Promise<void>} */ promex()
    const queue = generate()
    const group = generate()
    const consumer = jest.fn(async () => promise)

    await io.consume(queue, group, consumer)

    const channel = await findChannel('event')
    const callback = channel.subscribe.mock.calls[0][2]
    const content = randomBytes(8)
    const properties = {}
    const message = /** @type {import('amqplib').ConsumeMessage} */ { content, properties }

    callback(message)

    expect(consumer).toHaveBeenCalled()

    let closed = false
    let resolved = false

    setImmediate(() => {
      expect(closed).toStrictEqual(false)

      resolved = true
      promise.resolve()
    })

    await io.close()

    closed = true

    expect(resolved).toStrictEqual(true)
  })

  it('should wait for request processing completion', async () => {
    const promise = /** @type {Promise<void>} */ promex()
    const producer = jest.fn(async () => promise)

    await reply(/** @type {Function} */ producer)

    const channel = await findChannel('request')
    const callback = channel.consume.mock.calls[0][1]
    const content = generate()
    const properties = { replyTo: generate(), contentType: 'text/plain' }
    const message = /** @type {import('amqplib').ConsumeMessage} */ { content, properties }

    callback(message)

    expect(producer).toHaveBeenCalled()

    let closed = false
    let resolved = false

    setImmediate(() => {
      expect(closed).toStrictEqual(false)

      resolved = true
      promise.resolve(generate())
    })

    await io.close()

    closed = true

    expect(resolved).toStrictEqual(true)
  })

  it('should close connection', async () => {
    await io.close()

    expect(connection.close).toHaveBeenCalled()
  })
})

/**
 * @param {Function} [producer]
 * @return {Promise<void>}
 */
const reply = async (producer = () => undefined) => {
  // create channels
  await io.reply(generate(), producer)
  await io.emit(generate(), {})

  requests = await findChannel('request')
  events = await findChannel('event')
}

/**
 * @param {comq.topology.type} type
 * @returns {jest.MockedObject<comq.Channel>}
 */
const findChannel = (type) => {
  const index = connection.createChannel.mock.calls.findIndex(([t]) => (t === type))

  if (index === -1) throw new Error(`${type} channel hasn't been created`)

  return connection.createChannel.mock.results[index].value
}
