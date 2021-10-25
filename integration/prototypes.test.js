'use strict'

const { newid } = require('@toa.io/gears')

const framework = require('./framework')

let composition, remote

beforeAll(async () => {
  composition = await framework.compose(['messages', 'credits'])
  remote = await framework.remote('messages.messages')
})

afterAll(async () => {
  if (composition) await composition.disconnect()
  if (remote) await remote.disconnect()
})

it('should merge reply', async () => {
  const reply = await remote.invoke('transit', { input: { sender: newid(), text: '2' } })
  expect(reply).toMatchObject({ output: { id: expect.any(String), ok: 'ok' } })
})
