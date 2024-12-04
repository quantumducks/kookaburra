Feature: Events emission

  Background:
    Given the `mongo.one` database contains:
      | _id                              | foo | bar   | _version |
      | ff0431dac0e14fce95c4496c21086781 | 0   | hello | 1        |
    And the `mongo.receiver` database contains:
      | _id                              | count | _version |
      | ff0431dac0e14fce95c4496c21086781 | 0     | 1        |

  Scenario: Events emitted if no changes
    Given I compose components:
      | mongo.one      |
      | mongo.receiver |
    When I call `mongo.one.transit` with:
      """yaml
      input:
        foo: 1
        bar: world
      query:
        id: ff0431dac0e14fce95c4496c21086781
      """
    When I call `mongo.one.nothing` with:
      """yaml
      query:
        id: ff0431dac0e14fce95c4496c21086781
      """
    Then the reply is received
    And I wait 0.2 second
    And I call `mongo.receiver.observe` with:
      """yaml
      query:
        id: ff0431dac0e14fce95c4496c21086781
      """
    Then the reply is received:
      """yaml
      count: 2
      """
