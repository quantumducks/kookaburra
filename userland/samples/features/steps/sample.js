'use strict'

const { split } = require('@toa.io/libraries/yaml')
const { Given } = require('@cucumber/cucumber')

Given('I have (a )sample(s) of {operation} for {component}:',
  /**
   * @param {string} operation
   * @param {string} component
   * @param {string} yaml
   * @this {toa.samples.features.Context}
   */
  function (operation, component, yaml) {
    const samples = /** @type {toa.samples.Declaration[]} */ split(yaml)

    this.operation = operation
    this.component = component
    this.samples = samples
  })
