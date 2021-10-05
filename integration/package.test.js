'use strict'

const { load } = require('@kookaburra/package')

it('should load', async () => {
  await expect(load('./dummies/a', __dirname)).resolves.not.toThrow()
  await expect(load('./dummies/b', __dirname)).resolves.not.toThrow()
})

describe('prototype', () => {
  it('should use generic prototype as default', async () => {
    const manifest = await load('./dummies/a', __dirname)

    expect(manifest.entity.schema.properties.id)
      .toMatchObject({ $ref: 'https://schemas.kookaburra.dev/0.0.0/definitions#/definitions/id' })
  })

  it('should merge entity', async () => {
    const manifest = await load('./dummies/b', __dirname)

    expect(manifest.entity.schema.properties.length).toMatchObject({ type: 'integer', maximum: 10 })
    expect(manifest.entity.schema.properties.description).toMatchObject({ type: 'string' })
  })

  it('should merge entity`s required properties', async () => {
    const manifest = await load('./dummies/b', __dirname)
    expect(manifest.entity.schema.required).toStrictEqual(['length', 'title', 'id'])
  })

  it('should merge operations', async () => {
    const manifest = await load('./dummies/a', __dirname)

    expect(manifest.operations.transit).toBeDefined()
  })

  it('should merge events', async () => {
    const manifest = await load('./dummies/a', __dirname)

    expect(manifest.events.created).toStrictEqual({
      conditioned: true,
      subjective: false,
      bridge: expect.any(String),
      binding: expect.any(String),
      path: expect.stringMatching(/runtime\/prototype$/)
    })
  })

  it('should throw on declaration conflict', async () => {
    await expect(load('./dummies/event-declaration-conflict', __dirname))
      .rejects.toThrow(/merge: conflict/)
  })
})

describe('events', () => {
  it('should provide binding', async () => {
    const manifest = await load('./dummies/a', __dirname)

    expect(manifest.events.dummy.binding).toBe('@kookaburra/bindings.amqp')
  })
})

describe('receivers', () => {
  it('should load', async () => {
    const manifest = await load('./dummies/b', __dirname)

    expect(manifest.receivers['dummies.a.happened']).toStrictEqual({
      transition: 'transit',
      bridge: expect.any(String),
      path: expect.stringMatching(/dummies\/b$/)
    })
  })
})
