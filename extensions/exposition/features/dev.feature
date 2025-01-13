Feature: Dev

  Scenario: Delays
    Given the annotation:
      """yaml
      /:
        io:output: true
        anonymous: true
        dev:sleep: 3000
        GET:
          dev:stub: hello
        /nested:
          GET:
            dev:stub: world
      """
    # CORS permission
    When the following request is received:
      """
      OPTIONS / HTTP/1.1
      origin: http://example.com
      """
    Then the following reply is sent:
      """
      204 No Content
      access-control-allow-headers: accept, authorization, content-type, etag, if-match, if-none-match, sleep
      """
    When the following request is received:
      """
      GET / HTTP/1.1
      sleep: 2500
      """
    # check the response time
    Then the following reply is sent:
      """
      200 OK
      """
    When the following request is received:
      """
      GET /nested/ HTTP/1.1
      sleep: 500
      """
    Then the following reply is sent:
      """
      200 OK
      """
    When the following request is received:
      """
      GET / HTTP/1.1
      sleep: 3500
      """
    Then the following reply is sent:
      """
      400 Bad Request

      "Invalid sleep duration"
      """
