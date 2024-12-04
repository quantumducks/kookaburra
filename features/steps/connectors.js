'use strict'

const assert = require('node:assert')
const { When, Then } = require('@cucumber/cucumber')
const { diff } = require('jest-diff')
const { exceptions } = require('@toa.io/core')
const { transpose, match } = require('@toa.io/generic')
const { parse } = require('@toa.io/yaml')

const { cli } = require('./.connectors/cli')
const stage = require('./.workspace/components')

When('I debug command {word}',
  /**
   * @param {string} name
   * @param {import('@cucumber/cucumber').DataTable} inputs
   * @this {toa.features.Context}
   */
  async function(name, inputs) {
    const handler = cli(name)
    const argv = Object.fromEntries(inputs.raw())

    this.connector = await handler(argv)
  })

When('I boot {component} component',
  /**
   * @param {string} reference
   * @this {toa.features.Context}
   */
  async function(reference) {
    this.connector = /** @type {toa.core.Connector} */ await stage.component(reference)
  })

When('I compose {component} component',
  /**
   * @param {string} reference
   * @this {toa.features.Context}
   */
  async function(reference) {
    await stage.composition([reference], {})
  })

Then('I compose {component} component and it fails with:',
  /**
   * @param {string} reference
   * @this {toa.features.Context}
   */
  async function(reference, errorMessage) {
    await assert.rejects(stage.composition([reference], {}), {
      message: errorMessage
    })
  })

When('I stage {component} component',
  /**
   * @param {string} reference
   * @this {toa.features.Context}
   */
  async function(reference) {
    await stage.composition([reference])
  })

When('I compose components:',
  /**
   * @param {import('@cucumber/cucumber').DataTable} data
   * @this {toa.features.Context}
   */
  async function(data) {
    const cells = data.raw()
    const rows = transpose(cells)
    const references = rows[0]

    await stage.composition(references)
  })

Then('I disconnect',
  /**
   * @this {toa.features.Context}
   */
  async function() {
    if (this.connector) await this.connector.disconnect()
    if (this.storage?.migration) await this.storage.migration.disconnect()

    if (this.amqp) {
      await this.amqp.channel.close()
      await this.amqp.connection.close()
    }
  })

When('I invoke {token}',
  /**
   * @param {string} endpoint
   * @this {toa.features.Context}
   */
  async function(endpoint) {
    await invoke.call(this, endpoint)
  })

When('I invoke {token} with:',
  /**
   * @param {string} endpoint
   * @param {string} yaml
   * @this {toa.features.Context}
   */
  async function(endpoint, yaml) {
    const request = parse(yaml)

    await invoke.call(this, endpoint, request)
  })

When('I call {endpoint} with:',
  /**
   * @param {string} endpoint
   * @param {string} yaml
   * @this {toa.features.Context}
   */
  async function(endpoint, yaml) {
    const request = parse(yaml)

    await call.call(this, endpoint, request)
  })

When('I call {endpoint} {int} time(s) with:',
  /**
   * @param {string} endpoint
   * @param {number} times
   * @param {string} yaml
   * @this {toa.features.Context}
   */
  async function(endpoint, times, yaml) {
    const request = parse(yaml)

    for (let i = 0; i < times; i++)
      await call.call(this, endpoint, request)
  })

When('I call {endpoint} without waiting with:',
  /**
   * @param {string} endpoint
   * @param {string} yaml
   * @this {toa.features.Context}
   */
  async function(endpoint, yaml) {
    const request = parse(yaml)

    void call.call(this, endpoint, request)
  })

Then('the pending reply is not received yet',
  /**
   * @this {toa.features.Context}
   */
  async function() {
    if (this.exception !== undefined) throw this.exception

    assert.equal(this.reply, undefined, 'Reply is received')
  })

Then('the pending reply is received',
  /**
   * @this {toa.features.Context}
   */
  async function() {
    if (this.exception !== undefined) throw this.exception

    await this.pendingReply
  })

When('I call {endpoint}',
  /**
   * @param {string} endpoint
   * @this {toa.features.Context}
   */
  async function(endpoint) {
    await call.call(this, endpoint, {})
  })

Then('the reply is received:',
  /**
   * @param {string} yaml
   * @this {toa.features.Context}
   */
  function(yaml) {
    if (this.exception !== undefined) throw this.exception

    const expected = parse(yaml)

    if (Array.isArray(this.reply)) {
      assert.ok(Array.isArray(expected), 'Expected reply is not an array')
      assert.equal(this.reply.length, expected.length, diff(expected, this.reply))
    }

    const matches = match(this.reply, expected)

    assert.equal(matches, true, diff(expected, this.reply))
  })

Then('the error is received:',
  /**
   * @param {string} yaml
   * @this {toa.features.Context}
   */
  function(yaml) {
    if (this.exception !== undefined) {
      throw this.exception
    }

    if (!(this.reply instanceof Error)) {
      throw new Error('Reply is not an error')
    }

    const expected = parse(yaml)
    const matches = match(this.reply, expected)

    assert.equal(matches, true, diff(expected, this.reply))
  })

Then('the reply stream is received:',
  /**
   * @param {string} yaml
   * @this {toa.features.Context}
   */
  async function(yaml) {
    if (this.exception !== undefined)
      throw this.exception

    const expected = parse(yaml)
    const received = []

    for await (const chunk of this.reply) {
      received.push(chunk)
    }

    const matches = match(received, expected)

    assert.equal(matches, true, diff(expected, received))
  })

Then('the stream of {int} item(s) is received',
  /**
   * @param {number} expected
   * @this {toa.features.Context}
   */
  async function(expected) {
    if (this.exception !== undefined)
      throw this.exception

    // count items in the stream
    let received = 0

    for await (const _ of this.reply)
      received++

    assert.equal(received, expected, diff(expected, received))
  })

Then('the reply is received',
  /**
   * @this {toa.features.Context}
   */
  function() {
    if (this.exception !== undefined)
      throw this.exception

    assert.notStrictEqual(this.reply, undefined, 'Reply is not received')
  })

Then('the following exception is thrown:',
  /**
   * @param {string} yaml
   * @this {toa.features.Context}
   */
  function(yaml) {
    assert.ok(this.exception !== undefined, 'Exception is not thrown')

    const expected = parse(yaml)
    const matches = match(this.exception, expected)

    assert.equal(matches, true, diff(expected, this.exception))
  })

When('an event {label} is emitted with the payload:',
  /**
   * @param {string} label
   * @param {string} yaml
   * @this {toa.features.Context}
   */
  async function(label, yaml) {
    const payload = parse(yaml)

    await stage.emit(label, payload)
  })

Then('the {label} explained is:',
  /**
   * @param {string} endpoint
   * @param {string} yaml
   * @this {toa.features.Context}
   */
  async function(endpoint, yaml) {
    const operation = endpoint.split('.').pop()
    const remote = await stage.remote(endpoint)
    const explanation = remote.explain(operation)

    const expected = parse(yaml)
    const matches = match(explanation, expected)

    assert.equal(matches, true, diff(expected, explanation))
  })

/**
 * @param {string} endpoint
 * @param {toa.core.Request} request
 * @returns {Promise<void>}
 */
async function invoke (endpoint, request = {}) {
  const component = /** @type {toa.core.Component} */ this.connector

  const reply = await component.invoke(endpoint, request)

  if (reply === null) {
    this.reply = null
    return
  }

  if (reply.exception !== undefined) {
    throw reply.exception
  }

  if (reply.error !== undefined) {
    throw new Error(`${exceptions.names[reply.error.code]}: ${reply.error.message}`)
  }

  this.reply = reply.output
}

/**
 * @param {string} endpoint
 * @param {toa.core.Request} request
 * @this {toa.features.Context}
 * @return {Promise<void>}
 */
async function call (endpoint, request) {
  this.exception = undefined
  this.reply = undefined

  const [operation, component, namespace = 'default'] = endpoint.split('.').reverse()
  const remote = await stage.remote(`${namespace}.${component}`)

  try {
    this.pendingReply = remote.invoke(operation, request)
    this.reply = await this.pendingReply
  } catch (exception) {
    this.exception = exception
  }

  await remote.disconnect()
}
