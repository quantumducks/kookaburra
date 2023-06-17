'use strict'

const { freeze } = require('@toa.io/generic')

const { Operation } = require('./operation')

class Observation extends Operation {
  async acquire (store) {
    const scope = await this.query(store.request.query)
    const state = scope === null ? null : scope.get()

    freeze(state)

    store.scope = scope
    store.state = state
  }

  async run (store) {
    if (store.scope === null) store.reply = null
    else await super.run(store)
  }
}

exports.Observation = Observation
