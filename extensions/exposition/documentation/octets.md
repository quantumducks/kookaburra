# BLOBs

The `octets` directive family implements operations with BLOBs, using
the [Storages extention](/extensions/storages).
The most common use case is to handle file uploads, downloads, and processing.

## `octets:context`

Sets the [storage name](/extensions/storages/readme.md#annotation) to be used for the `octets`
directives under the current RTD Node.

```yaml
/images:
  octets:context: images
```

## `octets:put`

Stores the content of the request body into a storage, under the request path with
specified `content-type`.

If request's `content-type` is not acceptable, or if the request body does not pass
the [validation](/extensions/storages/readme.md#async-putpath-string-stream-readable-options-options-maybeentry),
the request is rejected with a `415 Unsupported Media Type` response.

The value of the directive must be `null` (defaults) or an object with the following optional
properties:

- `location`: a string that represents the path to store the
  content.
  If not specified, the path is the same as the request path.
- `limit`: [maximum size](#stream-size-limit) of the incoming stream.
- `accept`: a media type or an array of media types that are acceptable.
  If the `accept` property is not specified, any media type is acceptable (which is the default).
- `workflow`: [workflow](#workflows) to be executed once the content is successfully stored.
- `trust`: a list of [trusted origins](#downloading-external-content).

```yaml
/images:
  octets:context: images
  POST:
    octets:put:
      accept:
        - image/jpeg
        - image/png
        - video/*
      workflow:
        resize: images.resize
        analyze: images.analyze
```

### Headers

`content-id` header can be used to set the ID of the Entry.
The value must match the following regular expression `^[a-zA-Z0-9-_]{1,16}$`.

Non-standard `content-attributes` header can be used
to set initial [metadata](/extensions/storages/readme.md#entry) value for the Entry.

The value of the `content-attributes` header is a comma-separated list of key-value string pairs.
If no value is provided for a key, the string `true` is used.

```http
POST /images/ HTTP/1.1
content-type: image/jpeg
content-id: example-id
content-attributes: foo, bar=baz
content-attributes: baz=1
```

```yaml
attributes:
  foo: 'true'
  bar: 'baz'
  baz: '1'
```

If the Entry already exists, the `content-attributes` header is ignored.

### Location

The `location` property can be used to store the content under a different path.

```yaml
/images:
  octets:context: images
  POST:
    octets:put:
      location: /archive
```

Physical storage path is constructed by resolving the `location`
property [relative](https://datatracker.ietf.org/doc/html/rfc3986#section-5) to the request path.

### Stream size limit

The `limit` property can be used to set the maximum size of the incoming stream in bytes.

The property value can be specified as a number
(representing bytes) or a string that combines a number with a unit (e.g., `1MB`).
Both [binary and decimal prefixes](https://en.wikipedia.org/wiki/Binary_prefix) are supported.
If the prefix or unit is specified _incorrectly_ (e.g., `1mb`),
it will default to a binary prefix interpretation.

- `1b`, `1B`: 1 byte
- `1KB`: 1000 bytes
- `1KiB`: 1024 bytes
- `1kb`: 1024 bytes

The default value is `64MiB`.

### Downloading external content

The `octets:put` directive can be used to download external content:

```http
POST /images/ HTTP/1.1
content-location: https://example.com/image.jpg
content-length: 0
```

Requests with `content-location` header must have an empty body (`content-length: 0` header).

Target origin must be allowed by the `trust` property,
which can contain a list of trusted origins or regular expressions to match the full URL.

URL of the downloaded content is stored in the `origin` property of
the [Entry](/extensions/storages/readme.md#entry).

```yaml
/images:
  octets:context: images
  POST:
    octets:put:
      trust:
        - https://example.com
        - ^https://example\.com/[a-z]+\.jpe?g$
```

### Response

The response of the `octets:put` directive is the created Entry.

```
201 Created
content-type: application/yaml

id: eecd837c
type: image/jpeg
created: 1698004822358
```

If the `octets:put` directive contains a `workflow`, the response
is [multipart](protocol.md#multipart-types).
The first part represents the created Entry, which is sent immediately after the BLOB is stored,
while subsequent parts are results from the workflow endpoints, sent as soon as they are available.

In case a workflow endpoint returns an `Error`, the error part is sent,
and the response is closed.
Error's properties are added to the error part, among with the `step` identifier.

```
201 Created
content-type: multipart/yaml; boundary=cut

--cut

id: eecd837c
type: image/jpeg
created: 1698004822358

--cut

step: optimize
status: completed

--cut

step: resize
error:
  code: TOO_SMALL
  message: Image is too small
status: completed

--cut

step: analyze
status: exception

--cut--
```

## `octets:get`

Fetches the content of a stored BLOB corresponding to the request path, and returns it as the
response body with the corresponding `content-type`, `content-length`
and `etag` ([conditional GET](https://datatracker.ietf.org/doc/html/rfc2616#section-9.3) is
also supported).
The `accept` request header is disregarded.

The value of the directive is an object with the following properties:

- `meta`: `boolean` indicating whether an Entry is accessible.
  Defaults to `false`.

```yaml
/images:
  octets:context: images
  /*:
    GET:
      octets:get:
        blob: false # prevent access to the original BLOB
        meta: true  # allow access to an Entry
```

The `octets:get: ~` declaration is equivalent to defaults.

To access an Entry, the `accept` request header must contain the `octets.entry` subtype
in
the `toa` [vendor tree](https://datatracker.ietf.org/doc/html/rfc6838#section-3.2):

```http
GET /images/eecd837c HTTP/1.1
accept: application/vnd.toa.octets.entry+yaml
```

## `octets:delete`

Delete the entry corresponding to the request path.

```yaml
/images:
  octets:context: images
  DELETE:
    octets:delete: ~
```

The value of the directive may contain a [workflow](#workflows) declaration, to be executed before
the entry is deleted.

```yaml
/images:
  octets:context: images
  DELETE:
    octets:delete:
      workflow:
        cleanup: images.cleanup
```

The error returned by the workflow prevents the deletion of the entry.

## `octets:workflow`

Execute a [workflow](#workflows) on the entry under the request path.

```yaml
/images:
  /*:
    DELETE:
      octets:workflow:
        archive: images.archive
```

## Workflows

A workflow is a list of endpoints to be called.
The following input will be passed to each endpoint:

```yaml
authority: string
storage: string
path: string
entry: Entry
parameters: Record<string, string> # route parameters
```

- [Storages](/extensions/storages/readme.md)
- [Authorities](authorities.md)
- Example [workflow step processor](../features/steps/components/octets.tester)

A _workflow unit_ is an object with keys referencing the workflow step identifier, and an endpoint
as value.
Steps within a workflow unit are executed in parallel.

```yaml
octets:put:
  workflow:
    resize: images.resize
    analyze: images.analyze
```

A workflow can be a single unit, or an array of units.
If it's an array, the workflow units are executed in sequence.

```yaml
octets:put:
  workflow:
    - optimize: images.optimize   # executed first
    - resize: images.resize       # executed second
      analyze: images.analyze     # executed in parallel with `resize`
```

If one of the workflow units returns or throws an error,
the execution of the workflow is interrupted.

### Workflow tasks

A workflow unit which value starts with `task:` prefix will be executed as a Task.

```yaml
octets:put:
  workflow:
    optimize: task:images.optimize
```
