Feature: Dev

  Scenario: Delays
    Given the annotation:
      """yaml
      /:
        io:output: true
        anonymous: true
        GET:
          dev:sleep: 3000
          dev:stub: hello
      """
    When the following request is received:
      """
      GET / HTTP/1.1
      """
    Then the following reply is sent:
      """
      200 OK
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
      GET / HTTP/1.1
      sleep: 3500
      """
    Then the following reply is sent:
      """
      400 Bad Request

      "Invalid sleep duration"
      """
