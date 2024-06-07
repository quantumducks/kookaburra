Feature: Octets storage workflows

  Scenario: Running a workflow
    Given the `octets.tester` is running
    And the annotation:
      """yaml
      /:
        auth:anonymous: true
        octets:context: octets
        POST:
          octets:store:
            workflow:
              - add-foo: octets.tester.foo
                add-bar: octets.tester.bar
              - add-baz: octets.tester.baz
              - diversify: octets.tester.diversify
        /*:
          io:output: true
          GET:
            octets:fetch:
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

      id: 10cf16b458f759e0d617f2f3d83599ff
      type: application/octet-stream
      size: 8169
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
      --cut

      step: diversify
      output: hello
      status: completed
      --cut--
      """
    When the following request is received:
      """
      GET /10cf16b458f759e0d617f2f3d83599ff HTTP/1.1
      host: nex.toa.io
      accept: application/vnd.toa.octets.entry+yaml
      """
    Then the following reply is sent:
      """
      200 OK
      content-type: application/yaml

      id: 10cf16b458f759e0d617f2f3d83599ff
      type: application/octet-stream
      size: 8169
      meta:
        foo: bar
        bar: baz
        baz: qux
      """
    When the following request is received:
      """
      GET /10cf16b458f759e0d617f2f3d83599ff.hello.png HTTP/1.1
      host: nex.toa.io
      """
    Then the stream equals to `lenna.png` is sent with the following headers:
      """
      200 OK
      content-type: image/png
      content-length: 473831
      """

  Scenario: Getting error when running workflow on `store`
    Given the `octets.tester` is running
    Given the annotation:
      """yaml
      /:
        auth:anonymous: true
        octets:context: octets
        POST:
          octets:store:
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
      id: 10cf16b458f759e0d617f2f3d83599ff
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
          octets:store: ~
        /*:
          GET:
            octets:fetch: ~
          DELETE:
            octets:delete:
              workflow:
                echo: octets.tester.echo
      """
    When the stream of `lenna.ascii` is received with the following headers:
      """
      POST / HTTP/1.1
      host: nex.toa.io
      content-type: application/octet-stream
      """
    Then the following reply is sent:
      """
      201 Created
      """
    When the following request is received:
      """
      DELETE /10cf16b458f759e0d617f2f3d83599ff HTTP/1.1
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
      output: 10cf16b458f759e0d617f2f3d83599ff
      --cut--
      """
    When the following request is received:
      """
      GET /10cf16b458f759e0d617f2f3d83599ff HTTP/1.1
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
          octets:store: ~
        /*:
          GET:
            octets:fetch: ~
          DELETE:
            octets:delete:
              workflow:
                err: octets.tester.err
      """
    When the stream of `lenna.ascii` is received with the following headers:
      """
      POST / HTTP/1.1
      host: nex.toa.io
      content-type: application/octet-stream
      """
    Then the following reply is sent:
      """
      201 Created
      """
    When the following request is received:
      """
      DELETE /10cf16b458f759e0d617f2f3d83599ff HTTP/1.1
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
      GET /10cf16b458f759e0d617f2f3d83599ff HTTP/1.1
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
            octets:store:
              workflow:
                concat: octets.tester.concat
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

      id: 10cf16b458f759e0d617f2f3d83599ff
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
            octets:store:
              workflow:
                authority: octets.tester.authority
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

      id: 10cf16b458f759e0d617f2f3d83599ff
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
          octets:store: ~
        /*:
          DELETE:
            octets:workflow:
              echo: octets.tester.echo
      """
    When the stream of `lenna.ascii` is received with the following headers:
      """
      POST / HTTP/1.1
      host: nex.toa.io
      content-type: application/octet-stream
      """
    Then the following reply is sent:
      """
      201 Created
      """
    When the following request is received:
      """
      DELETE /10cf16b458f759e0d617f2f3d83599ff HTTP/1.1
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
      output: 10cf16b458f759e0d617f2f3d83599ff

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
          octets:store:
            workflow:
              - foo: octets.tester.foo
              - yield: octets.tester.yield
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

      id: 10cf16b458f759e0d617f2f3d83599ff
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
          octets:store:
            workflow:
              yield: octets.tester.yex
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

      id: 10cf16b458f759e0d617f2f3d83599ff
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
        POST:
          octets:store:
            workflow:
              foo: task:octets.tester.foo
        /*:
          io:output: true
          GET:
            octets:fetch:
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

      id: 10cf16b458f759e0d617f2f3d83599ff

      --cut

      step: foo
      status: completed
      output: null

      --cut--
      """
