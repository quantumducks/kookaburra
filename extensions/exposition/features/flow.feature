Feature: Request flow

  Scenario: Fetching URL
    Given the `octets.tester` is running
    And the annotation:
      """yaml
      /:
        octets:context: octets
        /:type:
          GET:
            anonymous: true
            io:output: true
            flow:fetch: octets.tester.redirect
      """
    When the following request is received:
      """
      GET /rfc HTTP/1.1
      host: nex.toa.io
      """
    Then the following reply is sent:
      """
      200 OK
      content-type: text/plain

      Faster Than Light Speed Protocol (FLIP)
      """
    When the following request is received:
      """
      GET /img HTTP/1.1
      host: nex.toa.io
      """
    Then the following reply is sent:
      """
      200 OK
      content-type: image/svg+xml
      """
    When the following request is received:
      """
      GET /err HTTP/1.1
      host: nex.toa.io
      """
    Then the following reply is sent:
      """
      404 Not Found
      """

  Scenario: Composing a stream
    Given the `sequences` is running with the following manifest:
      """yaml
      exposition:
        /:
          flow:compose:
            a: $[0]
            b: $[1]
            c: $[2]
            sum: $[0] + $[1] + $[2]
            str: \hello
            num: 1
            arr:
              - $[0]
              - $[1]
              - $[2]
              - $[0] + $[1] + $[2]
            copy: $
          POST: numbers
      """
    When the following request is received:
      """
      POST /sequences/ HTTP/1.1
      host: nex.toa.io
      content-type: text/plain
      accept: application/yaml

      3
      """
    Then the following reply is sent:
      """
      201 Created
      content-type: application/yaml

      a: 0
      b: 1
      c: 2
      sum: 3
      str: hello
      num: 1
      arr:
        - 0
        - 1
        - 2
        - 3
      copy:
        - 0
        - 1
        - 2
      """

  Scenario: Composing with multiple possible shapes
    Given the `sequences` is running with the following manifest:
      """yaml
      exposition:
        /:
          flow:compose:
            - a: $[0].b.c
            - b: $[0]
          POST: numbers
      """
    When the following request is received:
      """
      POST /sequences/ HTTP/1.1
      host: nex.toa.io
      content-type: text/plain
      accept: application/yaml

      3
      """
    Then the following reply is sent:
      """
      201 Created
      content-type: application/yaml

      b: 0
      """

  Scenario: Composing with text value
    Given the `sequences` is running with the following manifest:
      """yaml
      exposition:
        /:
          flow:compose: $[1]
          POST: numbers
      """
    When the following request is received:
      """
      POST /sequences/ HTTP/1.1
      host: nex.toa.io
      content-type: text/plain
      accept: application/yaml

      3
      """
    Then the following reply is sent:
      """
      201 Created
      content-type: application/yaml

      1
      """
