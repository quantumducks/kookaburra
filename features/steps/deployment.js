'use strict'

const assert = require('node:assert')
const { join } = require('node:path')

const { load, parse } = require('@toa.io/yaml')
const { match } = require('@toa.io/generic')

const extract = require('./.deployment')

const { When, Then } = require('@cucumber/cucumber')

When('I export deployment',
  function () {
    return extract.deployment.call(this)
  })

When('I export images',
  function () {
    return extract.images.call(this)
  })

When('I export deployment for {word}',
  function (env) {
    return extract.deployment.call(this, env)
  })

Then('exported {helm-artifact} should contain:',
  /**
   * @param {string} artifact
   * @param {string} text
   * @return {Promise<void>}
   */
  async function (artifact, text) {
    const matches = await contains(this.cwd, artifact, text)

    assert.equal(matches, true, `'${artifact}' doesn't match`)
  })

Then('exported {helm-artifact} should not contain:',
  /**
   * @param {string} artifact
   * @param {string} text
   * @return {Promise<void>}
   */
  async function (artifact, text) {
    const matches = await contains(this.cwd, artifact, text)

    assert.equal(matches, false, `'${artifact}' contain:\n${text}`)
  })

/**
 * @param {string} cwd
 * @param {string} artifact
 * @param {string} text
 * @return {Promise<boolean>}
 */
const contains = async (cwd, artifact, text) => {
  const filename = artifact + '.yaml'
  const path = join(cwd, 'deployment', filename)
  const contents = await load(path)
  const expected = parse(text)

  return match(contents, expected)
}
