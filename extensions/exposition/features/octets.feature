Feature: Octets directive family

  Background:
    Given the annotation:
      """yaml
      /:
        io:output: true
        auth:anonymous: true
        octets:context: octets
        POST:
          octets:put: ~
        /*:
          GET:
            octets:get: ~
          DELETE:
            octets:delete: ~
        /media:
          /jpeg:
            POST:
              octets:put:
                accept: image/jpeg
          /jpeg-or-png:
            POST:
              octets:put:
                accept:
                  - image/jpeg
                  - image/png
          /images:
            POST:
              octets:put:
                accept: image/*
            /*:
              GET:
                octets:get: ~
        /limit-1kb:
          POST:
            octets:put:
              limit: 1kb
        /limit-100kb:
          POST:
            octets:put:
              limit: 100kb
      """

  Scenario: Basic storage operations
    When the stream of `lenna.ascii` is received with the following headers:
      """
      POST / HTTP/1.1
      host: nex.toa.io
      accept: application/yaml
      content-type: application/octet-stream
      """
    Then the following reply is sent:
      """
      201 Created
      content-type: application/yaml

      id: ${{ id }}
      type: application/octet-stream
      size: 8169
      """
    When the following request is received:
      """
      GET /${{ id }} HTTP/1.1
      host: nex.toa.io
      """
    Then the stream equals to `lenna.ascii` is sent with the following headers:
      """
      200 OK
      content-type: application/octet-stream
      content-length: 8169
      etag: ${{ ETAG }}
      """
    When the following request is received:
      """
      GET /${{ id }} HTTP/1.1
      host: nex.toa.io
      if-none-match: ${{ ETAG }}
      """
    Then the following reply is sent:
      """
      304 Not Modified
      """
    When the following request is received:
      """
      GET /${{ id }}?foo=bar HTTP/1.1
      host: nex.toa.io
      """
    Then the following reply is sent:
      """
      404 Not Found
      """
    When the following request is received:
      """
      DELETE /${{ id }} HTTP/1.1
      host: nex.toa.io
      """
    Then the following reply is sent:
      """
      204 No Content
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

  Scenario: Media type control
    When the stream of `lenna.png` is received with the following headers:
      """
      POST /media/jpeg-or-png/ HTTP/1.1
      host: nex.toa.io
      content-type: image/jpeg
      """
    Then the following reply is sent:
      """
      400 Bad Request
      """
    When the stream of `lenna.png` is received with the following headers:
      """
      POST /media/jpeg/ HTTP/1.1
      host: nex.toa.io
      """
    Then the following reply is sent:
      """
      415 Unsupported Media Type
      """
    When the stream of `lenna.png` is received with the following headers:
      """
      POST /media/jpeg-or-png/ HTTP/1.1
      host: nex.toa.io
      """
    Then the following reply is sent:
      """
      201 Created
      """

  Scenario: Size limit
    When the stream of `albert.jpg` is received with the following headers:
      """
      POST /limit-1kb/ HTTP/1.1
      host: nex.toa.io
      content-type: image/jpeg
      accept: text/plain
      """
    Then the following reply is sent:
      """
      413 Request Entity Too Large

      Size limit is 1kb
      """

    When the stream of `albert.jpg` is received with the following headers:
      """
      POST /limit-100kb/ HTTP/1.1
      host: nex.toa.io
      content-type: image/jpeg
      """
    Then the following reply is sent:
      """
      201 Created
      """

  Scenario Outline: Detecting `<type>`
    When the stream of `sample.<ext>` is received with the following headers:
      """
      POST /media/images/ HTTP/1.1
      host: nex.toa.io
      accept: application/yaml
      """
    Then the following reply is sent:
      """
      201 Created

      type: <type>
      """
    Examples:
      | ext  | type       |
      | jpeg | image/jpeg |
      | jxl  | image/jxl  |
      | gif  | image/gif  |
      | heic | image/heic |
      | avif | image/avif |
      | webp | image/webp |

  Scenario: Accepting `image/svg+xml`
    When the stream of `sample.svg` is received with the following headers:
      """
      POST /media/images/ HTTP/1.1
      host: nex.toa.io
      content-type: image/svg+xml
      accept: application/yaml
      """
    Then the following reply is sent:
      """
      201 Created

      type: image/svg+xml
      """

  Scenario: Rejection video/avi
    When the stream of `sample.avi` is received with the following headers:
      """
      POST /media/images/ HTTP/1.1
      host: nex.toa.io
      """
    Then the following reply is sent:
      """
      415 Unsupported Media Type
      """

  Scenario: Fetching non-existent BLOB
    When the following request is received:
      """
      GET /whatever HTTP/1.1
      host: nex.toa.io
      """
    Then the following reply is sent:
      """
      404 Not Found
      """

  Scenario: Fetching a BLOB with trailing slash
    When the stream of `lenna.ascii` is received with the following headers:
      """
      POST / HTTP/1.1
      host: nex.toa.io
      accept: application/yaml
      content-type: application/octet-stream
      """
    And the following request is received:
      """
      GET /10cf16b458f759e0d617f2f3d83599ff/ HTTP/1.1
      host: nex.toa.io
      accept: text/plain
      """
    Then the following reply is sent:
      """
      404 Not Found
      content-type: text/plain

      Trailing slash is redundant
      """
