'use strict'

const assert = require('node:assert')
const { split, parse } = require('@toa.io/yaml')
const { match } = require('@toa.io/generic')

const { Then } = require('@cucumber/cucumber')

Then('{word} {word} {word} spec should contain:',
  /**
   * @param {string} name
   * @param {string} kind
   * @param {string} node
   * @param {string} yaml
   * @this {toa.features.Context}
   */
  async function(name, kind, node, yaml) {
    const specs = split(this.stdout)
    const spec = specs.find((spec) => spec.kind === kind && spec.metadata.name === name)
    const object = extract(spec, node)
    const candidate = parse(yaml)
    const matches = match(object, candidate)

    assert.equal(matches, true)
  })

const extract = (spec, node) => {
  if (node === 'container') return spec.spec.template.spec.containers[0]
  if (node === 'template.spec') return spec.spec.template.spec
  if (node === 'rules') return spec.spec.rules

  throw new Error(`Unknown node '${node}'`)
}
