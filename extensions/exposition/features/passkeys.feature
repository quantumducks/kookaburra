Feature: Web Authentication

  Scenario: Create a new challenge to create a new passkey for existing identity
    Given the `identity.passkeys` configuration:
      """yaml
      name: Nex
      """
    And transient identity
    When the following request is received:
      """
      POST /identity/passkeys/${{ identity.id }}/challenges/ HTTP/1.1
      host: nex.toa.io
      authorization: Token ${{ identity.token }}
      accept: application/yaml
      content-type: application/yaml

      purpose: create
      """
    Then the following reply is sent:
      """
      201 Created

      challenge: ${{ challenge }}
      timeout: 60000
      authenticatorSelection:
        userVerification: preferred
        residentKey: required
      pubKeyCredParams:
        - type: public-key
          alg: -7
        - type: public-key
          alg: -257
      """
