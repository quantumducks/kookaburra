Feature: Web Authentication

  Scenario: Create a challenge to add a new passkey to existing identity
    Given the `identity.passkeys` configuration:
      """yaml
      name: Nex
      """
    And transient identity
    When the following request is received:
      """
      POST /identity/passkeys/challenges/${{ identity.id }}/ HTTP/1.1
      host: nex.toa.io
      authorization: Token ${{ identity.token }}
      accept: application/yaml
      content-type: application/yaml

      type: creation
      """
    Then the following reply is sent:
      """
      201 Created

      challenge: ${{ challenge }}
      identity: ${{ identity.id }}
      timeout: 60000
      pubKeyCredParams:
        - type: public-key
          alg: -7
        - type: public-key
          alg: -257
      """

  Scenario: Create a challenge to create a passkey to new identity
    Given the `identity.passkeys` configuration:
      """yaml
      name: Nex
      """
    And transient identity
    When the following request is received:
      """
      POST /identity/passkeys/challenges/ HTTP/1.1
      host: nex.toa.io
      accept: application/yaml
      content-type: application/yaml

      type: creation
      """
    Then the following reply is sent:
      """
      201 Created
      authorization: Token ${{ token }}

      challenge: ${{ challenge }}
      identity: ${{ identity }}
      timeout: 60000
      pubKeyCredParams:
        - type: public-key
          alg: -7
        - type: public-key
          alg: -257
      """
