'use strict'

const fixtures = require('./connector.fixtures')
const mock = fixtures.mock

jest.mock('../src/client', () => ({ Client: mock.Client }))
jest.mock('../src/query', () => ({ translate: mock.translate }))
jest.mock('../src/entry', () => ({ to: mock.to, from: mock.from }))

const { Connector } = require('../src/connector')

let connector, client

beforeAll(() => {
  connector = new Connector(fixtures.locator)

  client = fixtures.mock.Client.mock.instances[0]

  expect(client).toBeDefined()

  expect(fixtures.mock.Client).toHaveBeenCalledWith(
    Connector.host(fixtures.locator),
    fixtures.locator.domain,
    fixtures.locator.entity
  )
})

beforeEach(() => {
  jest.clearAllMocks()
})

it('should define name', () => {
  expect(Connector.name).toBe('MongoDB')
})

it('should connect', async () => {
  await connector.connection()

  expect(client.connect).toHaveBeenCalled()
})

it('should disconnect', async () => {
  await connector.disconnection()

  expect(client.disconnect).toHaveBeenCalled()
})

it('should add', async () => {
  const result = await connector.add(fixtures.entry)

  expect(client.add).toHaveBeenCalledWith(mock.to.mock.results[0].value)
  expect(mock.to).toHaveBeenCalledWith(fixtures.entry)
  expect(result).toBe(client.add.mock.results[0].value)
})

it('should get', async () => {
  const entry = await connector.get(fixtures.query)

  expect(entry).toBe(mock.from.mock.results[0].value)
  expect(mock.from).toHaveBeenCalledWith(client.get.mock.results[0].value)

  const { criteria, options } = mock.translate.mock.results[0].value

  expect(client.get).toHaveBeenCalledWith(criteria, options)
  expect(mock.translate).toHaveBeenCalledWith(fixtures.query)
})

it('should update', async () => {
  const ok = await connector.update(fixtures.entry)

  expect(ok).toBe(client.update.mock.results[0].value)

  const criteria = { _id: fixtures.entry.id }

  expect(client.update).toHaveBeenCalledWith(criteria, mock.to.mock.results[0].value)
  expect(mock.to).toHaveBeenCalledWith(fixtures.entry)
})

it('should find', async () => {
  const entries = await connector.find(fixtures.query)
  const found = client.find.mock.results[0].value

  const expected = found.map((result, index) => {
    expect(mock.from).toHaveBeenNthCalledWith(index + 1, result, index, found)

    return mock.from.mock.results[index].value
  })

  expect(entries).toStrictEqual(expected)
})
