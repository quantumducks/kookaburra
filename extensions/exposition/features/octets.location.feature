Feature: Octets location

  Scenario Outline: Store octets in a specified location
    Given the annotation:
      """yaml
      /:
        /foo:
          octets:context: octets
          auth:anonymous: true
          io:output: true
          POST:
            octets:put:
              location: <location>
          /bar:
            /*:
              GET:
                octets:get: ~
      """
    When the stream of `lenna.ascii` is received with the following headers:
      """
      POST /foo/ HTTP/1.1
      host: nex.toa.io
      accept: application/yaml
      content-type: application/octet-stream
      """
    Then the following reply is sent:
      """
      201 Created

      id: ${{ id }}
      """
    When the following request is received:
      """
      HEAD /foo/bar/${{ id }} HTTP/1.1
      """
    Then the following reply is sent:
      """
      200 OK
      """
    Examples:
      | location  |
      | ./bar     |
      | /foo/bar/ |

  Scenario: Executing a workflow with specified location
    Given the `octets.tester` is running
    And the annotation:
      """yaml
      /:
        auth:anonymous: true
        octets:context: octets
        POST:
          octets:put:
            location: /hello/world/
            workflow:
              echo: octets.tester.echo
          io:output: true
      """
    When the stream of `lenna.ascii` is received with the following headers:
      """
      POST / HTTP/1.1
      host: nex.toa.io
      accept: application/yaml, multipart/yaml
      content-type: application/octet-stream
      """
    Then the following reply is sent:
      """
      201 Created
      content-type: multipart/yaml; boundary=cut

      --cut

      id: ${{ id }}
      type: application/octet-stream
      size: 8169
      --cut

      step: echo
      status: completed
      output:
        path: /hello/world/${{ id }}
      --cut--
      """
