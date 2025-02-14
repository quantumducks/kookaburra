Feature: MongoDB Timestamps

  Background:
    Given the `mongo.one` database contains:
      | _id                              | foo | bar   | baz   | _created      | _version |
      | 72cf9b0ab0ac4ab2b8036e4e940ddcae | 3   | hello | world | 1709781946176 | 1        |
    And I compose `mongo.one` component

  Scenario: Querying with `_created`
    When I call `mongo.one.enumerate` with:
      """yaml
      query:
        criteria: _created<1709781946177
        limit: 10
      """
    Then the reply is received:
      """yaml
      - id: 72cf9b0ab0ac4ab2b8036e4e940ddcae
        foo: 3
        bar: hello
        baz: world
        _created: 1709781946176
        _version: 1
      """

  # break assertions and see values in exceptions

  Scenario: Updating with assignment
    When I call `mongo.one.assign` with:
      """yaml
      query:
        id: 72cf9b0ab0ac4ab2b8036e4e940ddcae
      input:
        foo: 5
      """
    Then the reply is received:
      """yaml
      id: 72cf9b0ab0ac4ab2b8036e4e940ddcae
      foo: 5
      _version: 2
      """

  Scenario: Creating and updating an entry
    When I call `mongo.one.transit` with:
      """yaml
      input:
        foo: 1
      """
    Then the reply is received:
      """yaml
      foo: 1
      _version: 1
      """
    When I call `mongo.one.transit` with:
      """yaml
      query:
        id: 72cf9b0ab0ac4ab2b8036e4e940ddcae
      input:
        foo: 5
      """
    Then the reply is received:
      """yaml
      foo: 5
      _version: 2
      """
