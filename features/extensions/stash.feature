Feature: Stash extension

  Scenario: Using cache
    Given I boot `stash` component
    When I invoke `set` with:
      """yaml
      input: hello
      """
    When I invoke `get`
    Then the reply is received:
      """yaml
      output: hello
      """

  Scenario: Storing an object
    Given I boot `stash` component
    When I invoke `store` with:
      """yaml
      input:
        foo: bar
      """
    When I invoke `fetch`
    Then the reply is received:
      """yaml
      output:
        foo: bar
      """

  Scenario: Storing an array
    Given I boot `stash` component
    When I invoke `store` with:
      """yaml
      input: [foo, bar]
      """
    When I invoke `fetch`
    Then the reply is received:
      """yaml
      output: [foo, bar]
      """

  Scenario: Using increment
    Given I boot `stash` component
    When I invoke `del` with:
      """yaml
      input: num
      """
    And I invoke `inc` with:
      """yaml
      input: num
      """
    Then the reply is received:
      """yaml
      output: 1
      """

  Scenario: Using DLM
    Given I compose `stash` component
    When I call `default.stash.set` with:
      """yaml
      input: 0
      """
    And I call `default.stash.locks` with:
      """yaml
      input: {}
      """
    Then the reply is received:
      """yaml
      output: [1, 2]
      """

  Scenario: Using DLM with delay
    Given I compose `stash` component
    When I call `default.stash.set` with:
      """yaml
      input: 0
      """
    And I call `default.stash.locks` with:
      """yaml
      input:
        delay: 5000
      """
    Then the reply is received:
      """yaml
      output: [1, 2]
      """

  Scenario: Deployment
    Given I have a component `stash`
    And I have a context with:
      """
      stash: redis://redis.example.com
      """
    When I export deployment
    Then exported values should contain:
      """
      variables:
        default-stash:
          - name: TOA_STASH_DEFAULT_STASH
            value: redis://redis.example.com
      """

  Scenario: Replay sample
    Given I have a component `stash`
    And my working directory is ./components/stash
    When I run `toa replay`
    Then program should exit with code 0

  Scenario: Invoke operation
    Given I have a component `stash`
    And I have a context with:
      """yaml
      amqp: amqp://localhost
      stash: redis://localhost
      """
    And I run `toa env`
    And I update an environment with:
    """

    """
    And my working directory is ./components/stash
    When I run `TOA_DEV=0 toa invoke set "{ input: 'foo' }"`
    Then program should exit with code 0
