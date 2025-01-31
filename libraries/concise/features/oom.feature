Feature: One or many

  Scenario: One or many of primitive type
    When I write schema:
      """yaml
      foo+: string
      """
    Then it is equivalent to:
      """yaml
      type: object
      properties:
        foo:
          oneOf:
            - type: string
            - type: array
              items:
                type: string
      """

  Scenario: One or many with default
    When I write schema:
      """yaml
      foo+: bar
      """
    Then it is equivalent to:
      """yaml
      type: object
      properties:
        foo:
          default: bar
          oneOf:
            - type: string
              default: bar
            - type: array
              items:
                type: string
                default: bar
      """

  Scenario: One or many of object type
    When I write schema:
      """yaml
      foo+:
        foo: string
        bar?: number
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
                bar:
                  type: number
              required: [foo]
            - type: array
              items:
                type: object
                properties:
                  foo:
                    type: string
                  bar:
                    type: number
                required: [foo]
      """

  Scenario: One or many as a wildcard property
    When I write schema:
      """yaml
      ~+: string
      """
    Then it is equivalent to:
      """yaml
      type: object
      patternProperties:
        "^.*$":
          oneOf:
            - type: string
            - type: array
              items:
                type: string
      """

  Scenario: One or many as a pattern property
    When I write schema:
      """yaml
      /^[a-z]+$/+: string
      """
    Then it is equivalent to:
      """yaml
      type: object
      patternProperties:
        "^[a-z]+$":
          oneOf:
            - type: string
            - type: array
              items:
                type: string
      """
