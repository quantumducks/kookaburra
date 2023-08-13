'use strict'

const { each } = require('@toa.io/generic')
const mock = require('./dns.mock')

jest.mock('node:dns/promises', () => mock)

const { dedupe } = require('../')

it('should be', async () => {
  expect(dedupe).toBeInstanceOf(Function)
})

it('should resolve hosts', async () => {
  const input = ['amqp://github.com:5672/vhost?test=true', 'https://google.com', 'https://nodejs.org/api/dns.html#dnslookuphostname-options-callback']
  const urls = await dedupe(input)

  expect(urls).toBeInstanceOf(Array)
  expect(urls.length).toStrictEqual(input.length)

  each(urls,
    /**
     * @param {string} reference
     * @param {number} i
     */
    async (reference, i) => {
      const original = new URL(input[i])
      const result = new URL(reference)

      expect(result.protocol).toStrictEqual(original.protocol)
      expect(result.pathname).toStrictEqual(original.pathname)
      expect(result.port).toStrictEqual(original.port)
      expect(result.hash).toStrictEqual(original.hash)
      expect(result.search).toStrictEqual(original.search)
      expect(result.hostname).toStrictEqual(mock.lookup.mock.results[i].value.address)
    })
})

it('should dedupe', async () => {
  const input = ['amqp://github.com:5672/vhost?test=true', 'amqp://github.com:5672/vhost?test=true', 'amqp://github.com:5672']
  const urls = await dedupe(input)

  expect(urls.length).toStrictEqual(2)
})

it('should dedupe host name and ip', async () => {
  const input = ['http://localhost', 'http://127.0.0.1']
  const urls = await dedupe(input)

  expect(urls).toStrictEqual(['http://127.0.0.1/'])
})
