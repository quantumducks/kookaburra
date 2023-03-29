'use strict'

const { Emitter } = require('./emitter')
const { Receiver } = require('./receiver')
const { Consumer } = require('./consumer')
const { Producer } = require('./producer')

class Factory {
  /**
   * @param {toa.core.Locator} source
   * @param {string} label
   * @param {string} group
   * @param {toa.core.Receiver} receiver
   * @returns {toa.core.Connector}
   */
  receiver (source, label, group, receiver) {
    return new Receiver(label, receiver)
  }

  /**
   * @param {toa.core.Locator} locator
   * @param {string} label
   * @returns {toa.core.bindings.Emitter}
   */
  emitter (locator, label) {
    return new Emitter(locator, label)
  }

  /**
   * @param {toa.core.Locator} locator
   * @param {string} endpoint
   * @returns {toa.core.bindings.Consumer}
   */
  consumer (locator, endpoint) {
    return new Consumer(locator, endpoint)
  }

  /**
   * @param {toa.core.Locator} locator
   * @param {string[]} endpoints
   * @param {toa.core.Component} component
   * @returns {toa.core.Connector}
   */
  producer (locator, endpoints, component) {
    return new Producer(locator, endpoints, component)
  }
}

exports.Factory = Factory
