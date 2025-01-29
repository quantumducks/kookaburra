import assert from 'node:assert'
import { Mapping } from './Mapping'
import type { Parameter } from '../../RTD'

export class Segments extends Mapping<Record<string, string>> {
  public constructor (map: Record<string, string>) {
    assert.ok(map.constructor === Object, '`map:segments` must be an object')

    assert.ok(Object.values(map).every((value) => typeof value === 'string'),
      '`map:segments ` must be an object with string values')

    super(map)
  }

  public override properties (_: unknown, parameters: Parameter[]): Record<string, string> {
    return Object.entries(this.value).reduce((properties: Record<string, string>, [property, parameter]) => {
      const index = parameters.findIndex(({ name }) => name === parameter)

      assert.ok(index > -1, `Route parameter '${parameter}' is missing`)

      properties[property] = parameters[index].value
      parameters.splice(index, 1)

      return properties
    }, {})
  }
}
