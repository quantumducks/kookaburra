'use strict'

const { retry } = require('@toa.io/generic')

const { Operation } = require('./operation')
const {
  StateConcurrencyException,
  StateNotFoundException,
  DuplicateException,
  Exception
} = require('./exceptions')

class Transition extends Operation {
  #concurrency

  constructor (cascade, scope, contract, query, definition) {
    super(cascade, scope, contract, query, definition)

    this.#concurrency = definition.concurrency
  }

  async process (store) {
    return retry((retry) => this.#retry(store, retry), RETRY)
  }

  async acquire (store) {
    const { request } = store

    store.scope = request.query ? await this.query(request.query) : this.scope.init()

    if (store.scope === null) throw new StateNotFoundException()

    store.state = store.scope.get()
  }

  async commit (store) {
    const {
      scope,
      state,
      reply,
      retry
    } = store

    if (reply.error !== undefined) return

    scope.set(state)

    const result = await this.scope.commit(scope)

    if (result === false ||
      (result instanceof DuplicateException && result.message.includes('_id'))) {
      if (this.#concurrency === 'retry') {
        return retry()
      } else {
        throw new StateConcurrencyException()
      }
    }

    if (result instanceof Exception) throw result
  }

  async #retry (store, retry) {
    store.retry = retry

    return super.process(store)
  }
}

const RETRY = {
  base: 10,
  max: 5000,
  dispersion: 1,
  retries: Infinity
}

exports.Transition = Transition
