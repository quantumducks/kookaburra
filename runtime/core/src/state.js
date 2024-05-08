'use strict'

const { empty } = require('@toa.io/generic')

const {
  StatePreconditionException,
  StateNotFoundException
} = require('./exceptions')

class State {
  #associated
  #storage
  #entity
  #emission

  constructor (storage, entity, emission, associated) {
    this.#storage = storage
    this.#entity = entity
    this.#emission = emission
    this.#associated = associated === true
  }

  init (id) {
    return this.#entity.init(id)
  }

  async object (query) {
    const record = await this.#storage.get(query)

    if (record === null) {
      if (this.#associated && query.id !== undefined && query.version === undefined) {
        return this.init(query.id)
      } else if (query.version !== undefined) throw new StatePreconditionException()
    }

    if (record === null) {
      return null
    } else {
      return this.#entity.object(record)
    }
  }

  async objects (query) {
    const recordset = await this.#storage.find(query)

    return this.#entity.objects(recordset)
  }

  async stream (query) {
    return this.#storage.stream(query)
  }

  changeset (query) {
    return this.#entity.changeset(query)
  }

  none () {
    return null
  }

  async commit (state) {
    const event = state.event()

    let ok = true

    if (!empty(event.changeset)) {
      const object = state.get()

      ok = await this.#storage.store(object)

      // #20
      if (ok === true) {
        await this.#emission.emit(event)
      }
    }

    return ok
  }

  async apply (state) {
    const changeset = state.export()

    const result = await this.#storage.upsert(state.query, changeset)

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
