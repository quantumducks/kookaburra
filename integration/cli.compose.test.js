'use strict'

const framework = require('./framework')

const cli = framework.cli('./dummies/')

beforeAll(() => {
  framework.env('toa_local')
})

afterAll(() => {
  framework.env()
})

it('should compose', async () => {
  const abort = new AbortController()
  const kill = () => abort.abort()
  const process = cli('compose ./stats ./nulls', { signal: abort.signal })

  setTimeout(kill, 1000)

  try {
    await process
  } catch (error) {
    expect(error.killed).toStrictEqual(true)
  }
})
