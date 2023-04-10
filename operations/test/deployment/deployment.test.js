'use strict'

const clone = require('clone-deep')

const fixtures = require('./deployment.fixtures')
const { Deployment } = require('../../src/deployment/deployment')

/** @type {toa.deployment.Deployment} */
let deployment
/** @type {toa.deployment.installation.Options} */
let options

beforeEach(() => {
  deployment = new Deployment(fixtures.context, fixtures.compositions, fixtures.dependencies, fixtures.process)
  options = clone(fixtures.options)
})

it('should pass -n argument if options.namespace is set', async () => {
  await deployment.install(options)

  const call = fixtures.process.execute.mock.calls.find((call) => call[0] === 'helm' && call[1][0] === 'upgrade')

  expect(call).toBeDefined()

  const args = call[1]
  const index = args.findIndex((value) => value === '-n')
  const namespace = args[index + 1]

  expect(index).not.toStrictEqual(-1)
  expect(namespace).toStrictEqual(fixtures.options.namespace)
})

describe('variables', () => {
  let deployment /** @type {toa.deployment.Deployment} */

  it('should be define', () => {
    const context = clone(fixtures.context)

    deployment = new Deployment(context, fixtures.compositions, fixtures.dependencies, fixtures.process)

    expect(typeof deployment.variables).toBe('function')
  })

  it('should return variables', () => {
    const context = clone(fixtures.context)
    const [{ variables }] = fixtures.dependencies

    deployment = new Deployment(context, fixtures.compositions, fixtures.dependencies, fixtures.process)
    expect(deployment.variables()).toEqual(variables)
  })

  it('should return variables', () => {
    const context = clone(fixtures.context)
    const [{ variables }] = fixtures.dependencies

    deployment = new Deployment(context, fixtures.compositions, fixtures.dependencies, fixtures.process)

    expect(deployment.variables()).toEqual(variables)
  })

  it('should merge all variables', () => {
    const context = clone(fixtures.context)

    /** @type {toa.deployment.Dependency} */
    const dep1 = { variables: { global: [fixtures.secretVariable] } }

    /** @type {toa.deployment.Dependency} */
    const dep2 = { variables: { global: [fixtures.bindingVariable] } }

    deployment = new Deployment(context, fixtures.compositions, [dep1, dep2], fixtures.process)

    const result = deployment.variables()
    const expectedVariables = [fixtures.bindingVariable, fixtures.secretVariable]

    expect(result.global.length).toBe(expectedVariables.length)
    expect(result.global).toStrictEqual(expect.arrayContaining(expectedVariables))
  })
})
