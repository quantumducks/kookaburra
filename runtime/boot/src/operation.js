'use strict'

const { Transition, Observation, Assignment, Operation, Query } = require('@toa.io/core')

const boot = require('./index')

const operation = (manifest, endpoint, definition, context, scope) => {
  const cascade = boot.cascade(manifest, endpoint, definition, context)
  const reply = boot.contract.reply(definition.output, definition.error)
  const input = definition.input
  const request = boot.contract.request({ input })
  const contracts = { reply, request }
  const query = new Query(manifest.entity.schema.properties)
  const Type = TYPES[definition.type]

  return new Type(cascade, scope, contracts, query, definition)
}

const TYPES = {
  transition: Transition,
  observation: Observation,
  assignment: Assignment,
  computation: Operation,
  effect: Operation
}

exports.operation = operation
