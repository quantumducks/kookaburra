import { request } from './request'

it('should parse headers', () => {
  const http =
    'GET / HTTP/1.1\n' +
    'host: localhost:3000\n' +
    '\n'

  const result = request(http)

  expect(result.headers.get('host')).toEqual('localhost:3000')
})

it('should parse body', () => {
  const http =
    'POST / HTTP/1.1\n' +
    'host: localhost:3000\n' +
    'content-type: text/plain\n' +
    'content-length: 11\n' +
    '\n' +
    'hello world'

  const result = request(http)

  expect(result.body?.toString()).toEqual('hello world')
  expect(result.headers.get('host')).toEqual('localhost:3000')
})

it('should add default host header', () => {
  const http =
    'GET / HTTP/1.1\n' +
    '\n'

  const result = request(http, 'https://foo.bar')

  expect(result.headers.get('host')).toEqual('foo.bar')
})
