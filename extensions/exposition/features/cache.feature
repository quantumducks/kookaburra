Feature: Caching

  Background:
    Given the `identity.basic` database contains:
      # developer:secret
      # user:12345
      | _id                              | username  | password                                                     |
      | b70a7dbca6b14a2eaac8a9eb4b2ff4db | developer | $2b$10$ZRSKkgZoGnrcTNA5w5eCcu3pxDzdTduhteVYXcp56AaNcilNkwJ.O |
    Given the `identity.roles` database contains:
      | _id                              | identity                         | role      |
      | 775a648d054e4ce1a65f8f17e5b51803 | b70a7dbca6b14a2eaac8a9eb4b2ff4db | developer |

  Scenario: Caching successful response
    Given the annotation:
      """yaml
      /:
        anonymous: true
        GET:
          cache:control: max-age=60000
          dev:stub: hello
      """
    When the following request is received:
      """
      GET / HTTP/1.1
      accept: text/plain
      """
    Then the following reply is sent:
      """
      200 OK
      content-type: text/plain
      cache-control: max-age=60000

      hello
      """

  Scenario: Nested cache directives
    Given the annotation:
      """yaml
      /:
        cache:control: max-age=30000
        GET:
          anonymous: true
          dev:stub: hello
        /foo:
          auth:role: developer
          GET:
            dev:stub: hello
        /bar:
          auth:role: developer
          cache:control: max-age=60000, public
          GET:
            dev:stub: hello
      """
    When the following request is received:
      """
      GET / HTTP/1.1
      accept: text/plain
      """
    Then the following reply is sent:
      """
      200 OK
      content-type: text/plain
      cache-control: max-age=30000

      hello
      """
    When the following request is received:
      """
      GET /foo/ HTTP/1.1
      accept: text/plain
      authorization: Basic ZGV2ZWxvcGVyOnNlY3JldA==
      """
    Then the following reply is sent:
      """
      200 OK
      content-type: text/plain
      cache-control: private, max-age=30000

      hello
      """
    When the following request is received:
      """
      GET /bar/ HTTP/1.1
      accept: text/plain
      authorization: Basic ZGV2ZWxvcGVyOnNlY3JldA==
      """
    Then the following reply is sent:
      """
      200 OK
      content-type: text/plain
      cache-control: no-cache, max-age=60000, public

      hello
      """
    And the reply does not contain:
      """
      cache-control: private, max-age=30000
      """

  Scenario: Cache-control is not added when request is unsafe
    Given the annotation:
      """yaml
      /:
        anonymous: true
        cache:control: max-age=60000
        POST:
          dev:stub: hello
      """
    When the following request is received:
      """
      POST / HTTP/1.1
      accept: application/yaml
      """
    Then the reply does not contain:
      """
      cache-control: max-age=60000
      """

  Scenario: Cache-control is added without implicit modifications
    Given the annotation:
      """yaml
      /:
        auth:role: developer
        cache:exact: max-age=60000, public
        GET:
          dev:stub: hello
      """
    When the following request is received:
      """
      GET / HTTP/1.1
      authorization: Basic ZGV2ZWxvcGVyOnNlY3JldA==
      accept: text/plain

      """
    Then the following reply is sent:
      """
      200 OK
      content-type: text/plain
      cache-control: max-age=60000, public

      hello
      """

  Scenario: Response without caching
    Given the annotation:
      """yaml
      /:
        anonymous: true
        GET:
          dev:stub: hello
      """
    When the following request is received:
      """
      GET / HTTP/1.1
      accept: text/plain
      """
    Then the reply does not contain:
      """
      cache-control:
      """
