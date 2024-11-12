Feature: Octets storage workflows

  Scenario: Running a workflow
    Given the `octets.tester` is running
    And the annotation:
      """yaml
      /:
        auth:anonymous: true
        octets:context: octets
        POST:
          octets:put:
            workflow:
              - add-foo: octets.tester.foo
                add-bar: octets.tester.bar
              - add-baz: octets.tester.baz
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
      size: 8169
      type: application/octet-stream
      checksum: 10cf16b458f759e0d617f2f3d83599ff
      --cut

      step: add-foo
      status: completed
      --cut

      step: add-bar
      output:
        bar: baz
      status: completed
      --cut

      step: add-baz
      status: completed
      --cut--
      """

  Scenario: Composing workflow results
    Given the `octets.tester` is running
    And the annotation:
      """yaml
      /:
        auth:anonymous: true
        octets:context: octets
        POST:
          octets:put:
            workflow:
              - add-foo: octets.tester.foo
                add-bar: octets.tester.bar
              - add-baz: octets.tester.baz
          flow:compose:
            checksum: $[0].checksum
            bar: $[2].output.bar
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
      content-type: application/yaml

      checksum: 10cf16b458f759e0d617f2f3d83599ff
      bar: baz
      """

  Scenario: Getting error when running workflow on `store`
    Given the `octets.tester` is running
    Given the annotation:
      """yaml
      /:
        auth:anonymous: true
        octets:context: octets
        POST:
          octets:put:
            workflow:
              - add-foo: octets.tester.foo
              - add-bar: octets.tester.err
              - add-baz: octets.tester.baz
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

      step: add-foo
      status: completed
      --cut

      step: add-bar
      error:
        code: ERROR
        message: Something went wrong
      status: completed
      --cut--
      """

  Scenario: Running a workflow on `delete`
    Given the `octets.tester` is running
    And the annotation:
      """yaml
      /:
        auth:anonymous: true
        octets:context: octets
        POST:
          octets:put: ~
          io:output: true
        /*:
          GET:
            octets:get: ~
          DELETE:
            octets:delete:
              workflow:
                echo: octets.tester.id
            io:output: true
      """
    When the stream of `lenna.ascii` is received with the following headers:
      """
      POST / HTTP/1.1
      host: nex.toa.io
      content-type: application/octet-stream
      accept: application/yaml
      """
    Then the following reply is sent:
      """
      201 Created

      id: ${{ id }}
      """
    When the following request is received:
      """
      DELETE /${{ id }} HTTP/1.1
      host: nex.toa.io
      accept: application/yaml, multipart/yaml
      """
    Then the following reply is sent:
      """
      202 Accepted
      content-type: multipart/yaml; boundary=cut

      --cut
      step: echo
      status: completed
      output: ${{ id }}
      --cut--
      """
    When the following request is received:
      """
      GET /${{ id }} HTTP/1.1
      host: nex.toa.io
      """
    Then the following reply is sent:
      """
      404 Not Found
      """

  Scenario: Error in the workflow on `delete`
    Given the `octets.tester` is running
    And the annotation:
      """yaml
      /:
        auth:anonymous: true
        octets:context: octets
        POST:
          octets:put: ~
          io:output: true
        /*:
          GET:
            octets:get: ~
          DELETE:
            octets:delete:
              workflow:
                err: octets.tester.err
            io:output: true
      """
    When the stream of `lenna.ascii` is received with the following headers:
      """
      POST / HTTP/1.1
      host: nex.toa.io
      content-type: application/octet-stream
      accept: application/yaml
      """
    Then the following reply is sent:
      """
      201 Created

      id: ${{ id }}
      """
    When the following request is received:
      """
      DELETE /${{ id }} HTTP/1.1
      host: nex.toa.io
      accept: application/yaml, multipart/yaml
      """
    Then the following reply is sent:
      """
      202 Accepted
      content-type: multipart/yaml; boundary=cut

      --cut

      step: err
      status: completed
      error:
        code: ERROR
        message: Something went wrong
      --cut--
      """
    When the following request is received:
      """
      GET /${{ id }} HTTP/1.1
      host: nex.toa.io
      """
    Then the following reply is sent:
      """
      200 OK
      """

  Scenario: Passing parameters to the workflow
    Given the `octets.tester` is running
    And the annotation:
      """yaml
      /:
        /:a/:b:
          auth:anonymous: true
          octets:context: octets
          POST:
            octets:put:
              workflow:
                concat: octets.tester.concat
            io:output: true
      """
    When the stream of `lenna.ascii` is received with the following headers:
      """
      POST /hello/world/ HTTP/1.1
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

      step: concat
      status: completed
      output: hello world
      --cut--
      """

  Scenario: Passing authority to the workflow
    Given the `octets.tester` is running
    And the annotation:
      """yaml
      /:
        /:a/:b:
          auth:anonymous: true
          octets:context: octets
          POST:
            octets:put:
              workflow:
                authority: octets.tester.authority
            io:output: true
      """
    When the stream of `lenna.ascii` is received with the following headers:
      """
      POST /hello/world/ HTTP/1.1
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

      step: authority
      status: completed
      output: nex
      --cut--
      """

  Scenario: Executing a workflow with `octets:workflow`
    Given the `octets.tester` is running
    And the annotation:
      """yaml
      /:
        auth:anonymous: true
        octets:context: octets
        POST:
          octets:put: ~
          io:output: true
        /*:
          DELETE:
            octets:workflow:
              id: octets.tester.id
            io:output: true
      """
    When the stream of `lenna.ascii` is received with the following headers:
      """
      POST / HTTP/1.1
      host: nex.toa.io
      content-type: application/octet-stream
      accept: application/yaml
      """
    Then the following reply is sent:
      """
      201 Created

      id: ${{ id }}
      """
    When the following request is received:
      """
      DELETE /${{ id }} HTTP/1.1
      host: nex.toa.io
      accept: application/yaml, multipart/yaml
      """
    Then the following reply is sent:
      """
      202 Accepted
      content-type: multipart/yaml; boundary=cut

      --cut

      step: id
      status: completed
      output: ${{ id }}

      --cut--
      """

  Scenario: Workflow with streaming response
    Given the `octets.tester` is running
    And the annotation:
      """yaml
      /:
        auth:anonymous: true
        octets:context: octets
        POST:
          octets:put:
            workflow:
              - foo: octets.tester.foo
              - yield: octets.tester.yield
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

      --cut

      step: foo
      status: completed

      --cut

      step: yield
      output: hello

      --cut

      step: yield
      output: world

      --cut

      step: yield
      status: completed

      --cut--
      """

  Scenario: Workflow with streaming response and an exception
    Given the `octets.tester` is running
    And the annotation:
      """yaml
      /:
        auth:anonymous: true
        octets:context: octets
        POST:
          octets:put:
            workflow:
              yield: octets.tester.yex
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

      --cut

      step: yield
      output: hello

      --cut

      step: yield
      output: world

      --cut

      step: yield
      status: exception

      --cut--
      """

  Scenario: Task workflow
    Given the `octets.tester` is running
    And the annotation:
      """yaml
      /:
        auth:anonymous: true
        octets:context: octets
        io:output: true
        POST:
          octets:put:
            workflow:
              foo: task:octets.tester.foo
        /*:
          GET:
            octets:get:
              meta: true
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

      --cut

      step: foo
      status: completed
      output: null

      --cut--
      """
