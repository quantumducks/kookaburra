'use strict'

const { StatePreconditionException, StateNotFoundException } = require('./exceptions')

class State {
  storage

  #associated
  #entities
  #emission

  constructor (storage, entity, emission, associated) {
    this.storage = storage
    this.#entities = entity
    this.#emission = emission
    this.#associated = associated === true
  }

  init (id) {
    return this.#entities.init(id)
  }

  fit (values) {
    return this.#entities.fit(values)
  }

  async object (query) {
    const record = await this.storage.get(query)

    if (record === null) {
      if (this.#associated && query.id !== undefined && query.criteria === undefined && query.version === undefined)
        return this.init(query.id)
      else if (query.version !== undefined)
        throw new StatePreconditionException()

      return null
    } else
      return this.#entities.object(record)
  }

  async objects (query) {
    const recordset = await this.storage.find(query)

    return this.#entities.objects(recordset)
  }

  async stream (query) {
    return this.storage.stream(query)
  }

  changeset (query) {
    return this.#entities.changeset(query)
  }

  none () {
    return null
  }

  async ensure (query, properties, input) {
    const object = this.#entities.init()
    const blank = object.get()

    Object.assign(blank, properties)

    object.set(blank)

    const record = await this.storage.ensure(query, properties, object.get())

    if (record.id !== blank.id) // exists
      return this.#entities.object(record)

    const event = object.event(input)

    await this.#emission.emit(event)

    return object
  }

  async commit (state, input) {
    const object = state.get()
    const ok = await this.storage.store(object)

    // #20
    if (ok === true) {
      const event = state.event(input)

      await this.#emission.emit(event)
    }

    return ok
  }

  async apply (state) {
    const changeset = state.export()

    const result = await this.storage.upsert(state.query, changeset)

    if (result === null) {
      if (state.query.version !== undefined) {
        throw new StatePreconditionException()
      } else {
        throw new StateNotFoundException()
      }
    } else {
      // same as above
      await this.#emission.emit({
        changeset,
        state: result
      })
    }

    return result
  }
}

exports.State = State
