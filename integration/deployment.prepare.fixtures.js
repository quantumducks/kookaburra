'use strict'

const compositions = [
  {
    name: 'credits-balance',
    components: ['credits-balance']
  },
  {
    name: 'dummies-a',
    components: ['dummies-a']
  },
  {
    name: 'messages',
    components: ['messages-messages', 'stats-stats']
  }
]

const services = [
  {
    name: 'exposition-gateway'
  }
]

exports.compositions = compositions
exports.services = services
