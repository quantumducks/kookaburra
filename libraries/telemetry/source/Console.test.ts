import { console, Console } from './'

let instance: Console

const streams: any = {
  stdout: {
    write: jest.fn()
  },
  stderr: {
    write: jest.fn()
  }
}

const context = {
  foo: 'bar',
  baz: 42
}

const channels = ['debug', 'info', 'warn', 'error'] as Array<'debug' | 'info' | 'warn' | 'error'>

beforeEach(() => {
  jest.clearAllMocks()

  instance = new Console({ streams, context })
})

it('should be', async () => {
  expect(instance).toBeDefined()
})

describe.each(channels)('%s',
  (severity) => {
    const channel = severity === 'error' ? streams.stderr : streams.stdout

    it('should write', () => {
      instance[severity]('hello')

      expect(channel.write).toBeCalled()

      expect(pop(channel)).toMatchObject({
        severity: severity.toUpperCase(),
        message: 'hello'
      })
    })

    it('should format message', () => {
      instance[severity]('hello %s', 'world')

      expect(pop(channel)).toMatchObject({
        time: expect.any(String),
        message: 'hello world'
      })
    })

    it('should add context', () => {
      instance[severity]('hello')

      expect(pop(channel)).toMatchObject({
        context
      })
    })

    it('should add attributes', async () => {
      const attributes = {
        foo: 'baz',
        baz: 24
      }

      instance[severity]('hello %s', 'world', attributes)

      expect(pop(channel)).toMatchObject({ attributes })
    })
  })

it('should not print below given level', () => {
  instance.configure({ level: 'warn' })
  instance.info('a')
  instance.error('b')

  expect(pop(streams.stdout)).toBeUndefined()
  expect(pop(streams.stderr)).toBeDefined()
})

it('should consider log() as debug()', async () => {
  instance.log('foo')

  const entry = pop(streams.stdout)

  expect(entry).toMatchObject({ severity: 'DEBUG' })
})

describe.each(channels)('console instance (%s)', (channel) => {
  it('should print message', () => {
    console[channel]('Hello')
  })

  it('should print attributes', async () => {
    console[channel]('Hello %s', 'again', { foo: 42 })
  })
})

it('should fork', async () => {
  const con = instance.fork({ bar: 'foo' })

  con.debug('hello')

  expect(pop(streams.stdout)).toMatchObject({
    context: { foo: 'bar', baz: 42, bar: 'foo' }
  })
})

function pop (channel: any): any {
  const buffer = channel.write.mock.calls[0]?.[0] as Buffer

  if (buffer === undefined)
    return undefined

  return JSON.parse(buffer.toString())
}
