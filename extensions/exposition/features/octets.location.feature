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
