# Development tools

## `dev:stub`

Returns a successful response with the given body.

```yaml
/foo:
  dev:sub: Hello!
/bar:
  dev:sub:
    hello: world
```

## `dev:sleep`

Enables delay before processing the request, up to given maximum time in milliseconds (unlimited by
if value is
`0`).
Desired delay can be set in the `sleep` request header.

```yaml
/foo:
  dev:sleep: 1000
```

```http
GET /foo/ HTTP/1.1
sleep: 500
```
