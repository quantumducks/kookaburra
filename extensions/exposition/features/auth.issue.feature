Feature: Issue authentication token for a response

  Scenario: Issue token
    Given the `echo` is running with the following manifest:
      """yaml
      exposition:
        /:
          POST:
            auth:issue: id
            io:output: true
            query: ~
            endpoint: echo
      """
    And transient identity
    When the following request is received:
      """
      POST /echo/ HTTP/1.1
      host: nex.toa.io
      accept: application/yaml
      content-type: application/yaml

      id: ${{ identity.id }}
      foo: bar
      """
    Then the following reply is sent:
      """
      201 Created
      authorization: Token ${{ token }}

      id: ${{ identity.id }}
      foo: bar
      """
