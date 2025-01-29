Feature: HTTP context mapping

  Scenario Outline: Mapping `<result>` language code
    Given the `echo` is running with the following manifest:
      """yaml
      exposition:
        /:
          io:output: true
          map:languages: [en, fr]
          GET:
            map:language: name # map resolved language code to the `name` property of the operation input
            endpoint: compute
      """
    When the following request is received:
      """
      GET /echo/ HTTP/1.1
      host: nex.toa.io
      accept: application/yaml
      accept-language: <accept>
      """
    Then the following reply is sent:
      """
      200 OK
      content-type: application/yaml
      content-language: <result>
      vary: accept-language, accept

      Hello <result>
      """
    Examples:
      | accept | result |
      | en     | en     |
      | en_US  | en     |
      | fr     | fr     |
      | sw     | en     |

  Scenario: Listing languages on the root
    Given the annotation:
    """
    /:
      languages: [en, fr]
    """
    And the `echo` is running with the following manifest:
      """yaml
      exposition:
        /:
          io:output: true
          GET:
            anonymous: true
            map:language: name
            endpoint: compute
      """
    When the following request is received:
      """
      GET /echo/ HTTP/1.1
      host: nex.toa.io
      accept-language: fr
      """
    Then the following reply is sent:
      """
      200 OK
      content-language: fr
      """

  Scenario: Headers used by mappings are added to CORS permissions
    Given the `echo` is running with the following manifest:
      """yaml
      exposition:
        /:
          io:output: true
          map:languages: [en, fr]
          GET:
            map:language: name
            map:headers:
              name: foo
            endpoint: compute
      """
    When the following request is received:
      """
      OPTIONS / HTTP/1.1
      host: nex.toa.io
      origin: https://example.com
      """
    Then the following reply is sent:
      """
      204 No Content
      access-control-allow-headers: accept, authorization, content-type, etag, if-match, if-none-match, accept-language, foo
      """

  Scenario: Mapping the value of an arbitrary header
    Given the `echo` is running with the following manifest:
      """yaml
      exposition:
        /:
          io:output: true
          GET:
            map:headers:
              name: foo
            endpoint: compute
      """
    When the following request is received:
      """
      GET /echo/ HTTP/1.1
      host: nex.toa.io
      accept: application/yaml
      foo: bar
      """
    Then the following reply is sent:
      """
      200 OK
      content-type: application/yaml
      vary: foo, accept

      Hello bar
      """

  Scenario: Mapping the `host` header value
    Given the `echo` is running with the following manifest:
      """yaml
      exposition:
        /:
          io:output: true
          GET:
            map:headers:
              name: host
            endpoint: compute
      """
    When the following request is received:
      """
      GET /echo/ HTTP/1.1
      host: nex.toa.io
      accept: application/yaml
      foo: bar
      """
    Then the following reply is sent:
      """
      200 OK
      content-type: application/yaml
      vary: accept

      Hello nex.toa.io
      """

  Scenario: Mapping a route parameter
    Given the `echo` is running with the following manifest:
      """yaml
      exposition:
        /:friend:
          io:output: true
          GET:
            map:segments:
              name: friend
            endpoint: compute
      """
    When the following request is received:
      """
      GET /echo/Ken/ HTTP/1.1
      host: nex.toa.io
      accept: text/plain
      """
    Then the following reply is sent:
      """
      200 OK

      Hello Ken
      """

  Scenario: Mapping the authority
    Given the annotation:
      """yaml
      authorities:
        one: the.one.com
      """
    Given the `echo` is running with the following manifest:
      """yaml
      exposition:
        /:
          GET:
            io:output: true
            map:authority: name
            endpoint: compute
      """
    When the following request is received:
      """
      GET /echo/ HTTP/1.1
      host: the.one.com
      accept: text/plain
      """
    Then the following reply is sent:
      """
      200 OK

      Hello one
      """
    When the following request is received:
      """
      GET /echo/ HTTP/1.1
      host: the.two.com
      accept: text/plain
      """
    Then the following reply is sent:
      """
      200 OK

      Hello the.two.com
      """

  Scenario: Mapping Bearer token claims
    Given local IDP is running
    And the `identity.federation` configuration:
      """yaml
      trust:
        - iss: http://localhost:44444
      implicit: true
      """
    And the `echo` is running with the following manifest:
      """yaml
      exposition:
        /:
          GET:
            anyone: true
            io:output: true
            map:claims:
              name: email
            endpoint: compute
      """
    And the IDP token for Alice is issued

    When the following request is received:
      """
      GET /echo/ HTTP/1.1
      authorization: Bearer ${{ Alice.id_token }}
      host: the.two.com
      accept: text/plain
      """
    Then the following reply is sent:
      """
      200 OK

      Hello Alice@test.local
      """

  Scenario: Mapping Bearer token claims during inception
    Given local IDP is running
    And the `identity.federation` configuration:
      """yaml
      trust:
        - iss: http://localhost:44444
      """
    And the `pots` is running with the following manifest:
      """yaml
      exposition:
        /:
          POST:
            auth:incept: id
            io:input: [title, volume]
            io:output: [id, title, volume]
            map:claims:
              title: email
            endpoint: create
      """
    And the IDP random token is issued

    When the following request is received:
      """
      POST /pots/ HTTP/1.1
      host: the.two.com
      authorization: Bearer ${{ random.id_token }}
      accept: application/yaml
      content-type: application/yaml

      volume: 1.5
      """
    Then the following reply is sent:
      """
      201 Created

      id: ${{ id }}
      title: ${{ random.email }}
      volume: 1.5
      """

  Scenario: Mapping non-exposed properties
    Given the `echo` is running with the following manifest:
      """yaml
      exposition:
        /:
          GET:
            io:output: true
            io:input: [] # disallow input
            map:authority: name
            endpoint: compute
      """
    When the following request is received:
      """
      GET /echo/ HTTP/1.1
      host: the.one.com
      accept: text/plain
      """
    Then the following reply is sent:
      """
      200 OK

      Hello the.one.com
      """
