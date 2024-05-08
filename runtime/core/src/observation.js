'use strict'

const { Operation } = require('./operation')

class Observation extends Operation {
  async run (store) {
    if (store.scope === null) store.reply = null
    else await super.run(store)
  }
}

exports.Observation = Observation
