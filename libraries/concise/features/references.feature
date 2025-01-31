Feature: Schema references

  Scenario: Schema reference as property
    When I write schema:
      """yaml
      foo: ref:types/ok
      """
    Then it is equivalent to:
      """yaml
      type: object
      properties:
        foo:
          $ref: types/ok
      """

  Scenario: Schema reference as array items
    When I write schema:
      """yaml
      foo: [ref:types/ok]
      """
    Then it is equivalent to:
      """yaml
      type: object
      properties:
        foo:
          type: array
          items:
            $ref: types/ok
      """

  Scenario: Self-reference
    When I write schema:
      """yaml
      foo:
        bar: number
      baz: ref:#/foo/bar
      """
    Then it is equivalent to:
      """yaml
      type: object
      properties:
        foo:
          type: object
          properties:
            bar:
              type: number
        baz:
          $ref: '#/properties/foo/properties/bar'
      """

  Scenario: Root self-refernece
    When I write schema:
      """yaml
      foo:
        bar: number
        next: ref:#/
      """
    Then it is equivalent to:
      """yaml
      type: object
      properties:
        foo:
          type: object
          properties:
            bar:
              type: number
            next:
              $ref: '#/'
      """
