'use strict'

async function transition (input, object, context) {
  const response = await context.aspects.http('local')
  const status = response.status

  const body = await response.json()

  return { output: { status, body } }
}

exports.transition = transition
