'use strict'

const { QuerySyntaxException } = require('../exceptions')

const options = (options, properties, system) => {
  if (options.sort !== undefined) options.sort = sort(options.sort, properties)

  if (options.projection !== undefined) projection(options.projection, properties)

  return options
}

const sort = (sort, properties) => {
  const result = []

  for (const sorting of sort) {
    const [property, direction] = sorting.split(':')

    if (properties[property] === undefined) {
      throw new QuerySyntaxException(`Sort property '${property}' is not defined`)
    }

    result.push([property, direction || 'asc'])
  }

  return result
}

const projection = (projection, properties) => {
  for (const property of projection) {
    if (properties[property] === undefined) {
      throw new QuerySyntaxException(`Projection property '${property}' is not defined`)
    }
  }

  for (const property of ['_version', '_created', '_updated', '_deleted'])
    if (!projection.includes(property))
      projection.push(property)
}

exports.options = options
