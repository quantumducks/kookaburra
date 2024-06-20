@security
Feature: Identity Federation

  Background:
    Given the `identity.federation` database is empty
    And local IDP is running

  Scenario: Getting identity for a new user
    Given the `identity.federation` configuration:
      """yaml
      trust:
        - iss: http://localhost:44444
      """
    And the IDP token for User is issued
    When the following request is received:
      """
      GET /identity/ HTTP/1.1
      host: nex.toa.io
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
      """
    # validate TOKEN
    When the following request is received:
      """
      GET /identity/ HTTP/1.1
      host: nex.toa.io
      accept: application/yaml
      authorization: Token ${{ User.token }}
      """
    Then the following reply is sent:
      """
      200 OK

      id: ${{ User.id }}
      """
    # ensuring identity idempotency
    When the following request is received:
      """
      GET /identity/ HTTP/1.1
      host: nex.toa.io
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
      trust:
        - iss: http://localhost:44444
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
      host: nex.toa.io
      authorization: Bearer ${{ GoodUser.id_token }}
      accept: application/yaml
      content-type: application/yaml
      """
    Then the following reply is sent:
      """
      200 OK
      authorization: Token ${{ GoodUser.token }}

      id: ${{ GoodUser.id }}
      """

  Scenario: Creating an Identity using inception
    Given the `identity.federation` configuration:
      """yaml
      trust:
        - iss: http://localhost:44444
      """
    Given the `users` is running with the following manifest:
      """yaml
      exposition:
        /:
          anonymous: true
          POST:
            io:output: [id]
            auth:incept: id
            endpoint: create
      """
    And the IDP token for Bill is issued
    When the following request is received:
      # identity inception
      """
      POST /users/ HTTP/1.1
      host: nex.toa.io
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
      host: nex.toa.io
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
      host: nex.toa.io
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
      host: nex.toa.io
      authorization: Bearer ${{ Bill.id_token }}
      content-type: application/yaml

      name: Mary Louis
      """
    Then the following reply is sent:
      """
      409 Conflict
      """

  Scenario: Granting a `system` role to a Principal
    Given the `identity.federation` configuration:
      """yaml
      trust:
        - iss: http://localhost:44444
      principal:
        iss: http://localhost:44444
        sub: root
      """
    And the IDP token for root is issued

    # create an identity
    When the following request is received:
      """
      GET /identity/ HTTP/1.1
      host: nex.toa.io
      authorization: Bearer ${{ root.id_token }}
      accept: application/yaml
      content-type: application/yaml
      """
    Then the following reply is sent:
      """
      200 OK
      authorization: Token ${{ root.token }}

      id: ${{ root.id }}
      """

    # check the role
    When the following request is received:
      """
      GET /identity/ HTTP/1.1
      host: nex.toa.io
      accept: application/yaml
      authorization: Token ${{ root.token }}
      """
    Then the following reply is sent:
      """
      200 OK

      id: ${{ root.id }}
      roles:
        - system
      """
