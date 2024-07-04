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

## `octets:store`

Stores the content of the request body into a storage, under the request path with
specified `content-type`.

If request's `content-type` is not acceptable, or if the request body does not pass
the [validation](/extensions/storages/readme.md#async-putpath-string-stream-readable-options-options-maybeentry),
the request is rejected with a `415 Unsupported Media Type` response.

The value of the directive is `null` or an object with the following properties:

- `limit`: a number of bytes (or
  a [string with units](https://www.npmjs.com/package/bytes#bytesparsestringnumber-value-numbernull))
  to limit the size of the uploaded content
  (default is 64MB, which should be enough for everyone ©).
- `accept`: a media type or an array of media types that are acceptable.
  If the `accept` property is not specified, any media type is acceptable (which is the default).
- `workflow`: [workflow](#workflows) to be executed once the content is successfully stored.
- `trust`: a list of [trusted origins](#downloading-external-content).

```yaml
/images:
  octets:context: images
  POST:
    octets:store:
      accept:
        - image/jpeg
        - image/png
        - video/*
      workflow:
        resize: images.resize
        analyze: images.analyze
```

Non-standard `content-meta` header can be used
to set initial [metadata](/extensions/storages/readme.md#entry) value for the Entry.

The value of the `content-meta` header is a comma-separated list of key-value string pairs.
If no value is provided for a key, the string `true` is used.

```http
POST /images/ HTTP/1.1
content-type: image/jpeg
content-meta: foo, bar=baz
content-meta: baz=1
```

```yaml
meta:
  foo: 'true'
  bar: 'baz'
  baz: '1'
```

If the Entry already exists, the `content-meta` header is ignored.

### Downloading external content

The `octets:store` directive can be used to download external content:

```http
POST /images/ HTTP/1.1
content-location: https://example.com/image.jpg
content-length: 0
```

Requests with `content-location` header must have an empty body (`content-length: 0` header).

Target origin must be allowed by the `trust` property,
which can contain a list of trusted origins or regular expressions to match the full URL.

```yaml
/images:
  octets:context: images
  POST:
    octets:store:
      trust:
        - https://example.com
        - ^https://example\.com/[a-z]+\.jpe?g$
```

### Response

The response of the `octets:store` directive is the created Entry.

```
201 Created
content-type: application/yaml

id: eecd837c
type: image/jpeg
created: 1698004822358
```

If the `octets:store` directive contains a `workflow`, the response
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

## `octets:fetch`

Fetches the content of a stored BLOB corresponding to the request path, and returns it as the
response body with the corresponding `content-type`, `content-length`
and `etag` ([conditional GET](https://datatracker.ietf.org/doc/html/rfc2616#section-9.3) is
also supported).
The `accept` request header is disregarded.

The value of the directive is an object with the following properties:

- `meta`: `boolean` indicating whether an Entry is accessible.
  Defaults to `false`.
- `blob`: `boolean` indicating whether the original BLOB is accessible,
  [BLOB variant](/extensions/storages/readme.md#async-fetchpath-string-maybereadable) must be
  specified in the path otherwise.
  Defaults to `true`.

```yaml
/images:
  octets:context: images
  /*:
    GET:
      octets:fetch:
        blob: false # prevent access to the original BLOB
        meta: true  # allow access to an Entry
```

The `octets:fetch: ~` declaration is equivalent to defaults.

To access an Entry, the `accept` request header must contain the `octets.entry` subtype
in
the `toa` [vendor tree](https://datatracker.ietf.org/doc/html/rfc6838#section-3.2):

```http
GET /images/eecd837c HTTP/1.1
accept: application/vnd.toa.octets.entry+yaml
```

## `octets:list`

Lists the entries stored under the request path.

The value of the directive is an object with the following properties:

- `meta`: `boolean` indicating whether the list of Entries is accessible.
  Defaults to `false`, which means that only entry identifiers are returned.

```yaml
/images:
  octets:context: images
  GET:
    octets:list:
      meta: true
```

The `octets:list: ~` declaration is equivalent to defaults.

To access a list of Entries, the `accept` request header must contain the `octets.entries` subtype:

```http
GET /images/ HTTP/1.1
accept: application/vnd.toa.octets.entries+yaml
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
octets:store:
  workflow:
    resize: images.resize
    analyze: images.analyze
```

A workflow can be a single unit, or an array of units.
If it's an array, the workflow units are executed in sequence.

```yaml
octets:store:
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
octets:store:
  workflow:
    optimize: task:images.optimize
```
