Feature: Primitive types

  Scenario Outline: Primitive <type> type
    When I write schema:
      """yaml
      <type>
      """
    Then it is equivalent to:
      """yaml
      type: "<type>"
      """
    Examples:
      | type    |
      | string  |
      | number  |
      | integer |
      | boolean |
      | array   |
      | object  |

  Scenario: No schema
    When I write schema:
      """yaml
      null
      """
    Then it is equivalent to:
      """yaml
      {}
      """
    When I write schema:
      """yaml
      undefined
      """
    Then it is equivalent to:
      """yaml
      {}
      """

  Scenario Outline: Default value of <type> type
    When I write schema:
      """yaml
      <value>
      """
    Then it is equivalent to:
      """yaml
      type: <type>
      default: <value>
      """
    Examples:
      | value     | type    |
      | something | string  |
      | 1         | number  |
      | 1.0       | number  |
      | true      | boolean |

  Scenario: String pattern
    When I write schema:
      """yaml
      foo: /^foo_/
      """
    Then it is equivalent to:
      """yaml
      type: object
      properties:
        foo:
          type: string
          pattern: "^foo_"
      """
