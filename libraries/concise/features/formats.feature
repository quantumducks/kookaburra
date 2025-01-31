Feature: String formats

  https://ajv.js.org/packages/ajv-formats.html

  Scenario Outline: <format> format
    When I write schema:
      """yaml
      <format>
      """
    Then it is equivalent to:
      """yaml
      type: string
      format: <format>
      """
    Examples:
      | format   |
      | date     |
      | uri      |
      | url      |
      | hostname |
      | email    |

  Scenario: Any
    When I write schema:
      """yaml
      foo: ~
      """
    Then it is equivalent to:
      """yaml
      type: object
      properties:
        foo: {}
      """
