Feature: Arrays

  Scenario: One of number constants
    When I write schema:
      """yaml
      foo: [1, 2, 3]
      """
    Then it is equivalent to:
      """yaml
      type: object
      properties:
        foo:
          type: number
          enum:
            - 1
            - 2
            - 3
      """

  Scenario: One of string constants
    When I write schema:
      """yaml
      foo: [bar, baz]
      """
    Then it is equivalent to:
      """yaml
      type: object
      properties:
        foo:
          type: string
          enum:
            - bar
            - baz
      """

  Scenario Outline: Array of <type> primitives
    When I write schema:
        """yaml
        foo: [<type>]
        """
    Then it is equivalent to:
        """yaml
        type: object
        properties:
          foo:
            type: array
            items:
              type: <type>
        """
    Examples:
      | type    |
      | string  |
      | number  |
      | integer |
      | boolean |

  Scenario: Array of concise objects
    When I write schema:
      """yaml
      foo:
        - foo: number
          bar: string
      """
    Then it is equivalent to:
      """yaml
      type: object
      properties:
        foo:
          type: array
          items:
            type: object
            properties:
              foo:
                type: number
              bar:
                type: string
      """

  Scenario: Array of concise objects with default values
    When I write schema:
      """yaml
      foo:
        - foo: 'hello'
          bar: 1
      """
    Then it is equivalent to:
      """yaml
      type: object
      properties:
        foo:
          type: array
          items:
            type: object
            properties:
              foo:
                type: string
                default: 'hello'
              bar:
                type: number
                default: 1
      """

  Scenario: One of concise objects
    When I write schema:
      """yaml
      foo:
        - foo: 'hello'
          bar: 1
        - baz: number
      """
    Then it is equivalent to:
      """yaml
      type: object
      properties:
        foo:
          oneOf:
            - type: object
              properties:
                foo:
                  type: string
                  default: 'hello'
                bar:
                  type: number
                  default: 1
            - type: object
              properties:
                baz:
                  type: number
      """
