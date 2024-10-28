Feature: Octets with Cloudinary storage

  Background:
    Given the annotation:
      """yaml
      /:
        io:output: true
        auth:anonymous: true
        octets:context: cloudinary
        POST:
          octets:put: ~
        /*:
          GET:
            octets:get: ~
          DELETE:
            octets:delete: ~
      """

  Scenario: Upload an image
    When the stream of `lenna.png` is received with the following headers:
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
      type: image/png
      size: 473831
      """
    When the following request is received:
      """
      GET /${{ id }} HTTP/1.1
      host: nex.toa.io
      """
    Then the stream equals to `lenna.png` is sent with the following headers:
      """
      200 OK
      content-type: image/png
      content-length: 473831
      """

  Scenario: Image transformations
    When the stream of `lenna.png` is received with the following headers:
      """
      POST / HTTP/1.1
      host: nex.toa.io
      content-type: image/png
      accept: application/yaml
      """
    Then the following reply is sent:
      """
      201 Created

      id: ${{ id }}
      """
    When the following request is received:
      """
      GET /${{ id }}.48x48.jpeg HTTP/1.1
      host: nex.toa.io
      """
    Then the stream equals to `lenna.48x48.jpeg` is sent with the following headers:
      """
      200 OK
      content-type: image/jpeg
      """
