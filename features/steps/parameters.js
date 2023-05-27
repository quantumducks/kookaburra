'use strict'

const { defineParameterType, setDefaultTimeout } = require('@cucumber/cucumber')

defineParameterType({
  name: 'path',
  regexp: /\.(?:\/[^'\s]*)?|\/toa(?:\/\w+)*\/?/,
  transformer: (path) => path
})

defineParameterType({
  name: 'component',
  regexp: /`(\w+.\w+)`/,
  transformer: (name) => name
})

defineParameterType({
  name: 'label',
  regexp: /`(\S+)`/,
  transformer: (name) => name
})

defineParameterType({
  name: 'token',
  regexp: /`(\w+)`/,
  transformer: (token) => token
})

defineParameterType({
  name: 'endpoint',
  regexp: /`((\w+.){2}(\w+))`/,
  transformer: (token) => token
})

defineParameterType({
  name: 'command',
  regexp: /`(.+)`/,
  transformer: (cmd) => cmd
})

defineParameterType({
  name: 'helm-artifact',
  regexp: /Chart|values/,
  transformer: (artifact) => artifact
})

defineParameterType({
  name: 'storage',
  regexp: /PostgreSQL/,
  transformer: (name) => name
})

setDefaultTimeout(10 * 60 * 1000)
