Feature: Identity Federation

  Background:
    Given the `identity.federation` database is empty
    Given local IDP is running

  Scenario: Getting identity for a new user
    Given the `identity.federation` configuration:
      """yaml
      explicit_identity_creation: false
      trust:
        - issuer: http://localhost:44444
      """
    And the IDP token for User is issued
    When the following request is received:
      """
      GET /identity/ HTTP/1.1
      authorization: Bearer ${{ User.id_token }}
      accept: application/yaml
      content-type: application/yaml
      """
    Then the following reply is sent:
      """
      200 OK
      authorization: Token ${{ User.token }}

      id: ${{ User.id }}
      roles: []
      scheme: BEARER
      """
    # validate TOKEN
    When the following request is received:
      """
      GET /identity/ HTTP/1.1
      accept: application/yaml
      authorization: Token ${{ User.token }}
      """
    Then the following reply is sent:
      """
      200 OK
      id: ${{ User.id }}
      """
    # ensuring identity idemptotency
    When the following request is received:
      """
      GET /identity/ HTTP/1.1
      authorization: Bearer ${{ User.id_token }}
      accept: application/yaml
      """
    Then the following reply is sent:
      """
      200 OK
      id: ${{ User.id }}
      """

  Scenario: Getting identity for a user with symmetric tokens
    Given the `identity.federation` configuration:
      """yaml
      explicit_identity_creation: false
      trust:
        - issuer: http://localhost:44444
          secrets:
            HS384:
              k1: the-secret
      """
    And the IDP HS384 token for GoodUser is issued with following secret:
      """
      the-secret
      """
    When the following request is received:
      """
      GET /identity/ HTTP/1.1
      authorization: Bearer ${{ GoodUser.id_token }}
      accept: application/yaml
      content-type: application/yaml
      """
    Then the following reply is sent:
      """
      200 OK
      authorization: Token ${{ GoodUser.token }}

      id: ${{ GoodUser.id }}
      scheme: bearer
      """

  Scenario: Creating an Identity using inception with existing credentials
    Given the `identity.federation` configuration:
      """yaml
      trust:
        - issuer: http://localhost:44444
      """
    Given the `users` is running with the following manifest:
      """yaml
      exposition:
        /:
          anonymous: true
          POST:
            incept: id
            endpoint: create
      """
    And the IDP token for Bill is issued
    When the following request is received:
      # identity inception
      """
      POST /users/ HTTP/1.1
      authorization: Bearer ${{ Bill.id_token }}
      accept: application/yaml
      content-type: application/yaml

      name: Bill Smith
      """
    Then the following reply is sent:
      """
      201 Created
      authorization: Token ${{ Bill.token }}

      id: ${{ Bill.id }}
      """
    # check that both tokens corresponds to the same id
    When the following request is received:
      """
      GET /identity/ HTTP/1.1
      authorization: Token ${{ Bill.token }}
      accept: application/yaml
      """
    Then the following reply is sent:
      """
      200 OK
      id: ${{ Bill.id }}
      """
    When the following request is received:
      """
      GET /identity/ HTTP/1.1
      authorization: Bearer ${{ Bill.id_token }}
      accept: application/yaml
      """
    Then the following reply is sent:
      """
      200 OK
      id: ${{ Bill.id }}
      """
    And the following request is received:
      # same credentials
      """
      POST /users/ HTTP/1.1
      authorization: Bearer ${{ Bill.id_token }}
      content-type: text/plain

      name: Mary Louis
      """
    Then the following reply is sent:
      """
      403 Forbidden
      """
