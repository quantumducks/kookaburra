'use strict'

const { resolve } = require('node:path')
const stage = require('@toa.io/userland/stage')

const binding = stage.binding.binding
const root = resolve(__dirname, '../components')

/** @type {toa.core.Component} */
let remote

beforeAll(async () => {
  process.env.TOA_DEV = '1'

  const path = resolve(root, 'tea.pots')

  await stage.composition([path])

  remote = await stage.remote('tea.pots')
})

afterAll(async () => {
  await stage.shutdown()

  delete process.env.TOA_DEV
})

it('should receive event', async () => {
  const created = await remote.invoke('transit', { input: { material: 'glass' } })
  const id = created.output.id
  const payload = { pot: id }
  const message = { payload }
  const request = { query: { id } }

  await binding.emit('store.orders.created', message)

  const reply = await remote.invoke('observe', request)

  expect(reply.output.booked).toStrictEqual(true)
})

it('should emit event', async () => {
  expect.assertions(1)

  const material = 'steel'

  await binding.subscribe('tea.pots.created', (pot) => {
    expect(pot.payload.material).toStrictEqual(material)
  })

  await remote.invoke('transit', { input: { material } })
})
