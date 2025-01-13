Feature: Request interruptions

  Scenario: Connection reset while processing a request
    Given the annotation:
      """yaml
      /:
        io:output: true
        anonymous: true
        dev:sleep: 3000
        GET:
          dev:stub: hello
      """
    When the following request is interrupted after 1 second:
      """
      GET / HTTP/1.1
      sleep: 2000
      """
    Then after 2 seconds
    And the process is running
