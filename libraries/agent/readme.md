# Agent

Text-based HTTP client with variables and expressions.

## Function pipelines

- `id`: generate UUID in hex format
- `password [length]`: generate password of a given length (default `16`)
- `basic (credentials)`: encode `credentials.username` and `credentials.password` to base64-encoded
  credentials
- `set (variable)`: set a variable to the current pipeline value

```http
POST /identity/basic/ HTTP/1.1
host: the.one.com
content-type: application/yaml
accept: application/yaml

username: #{{ id | set Bubba.username }}
password: '#{{ password 8 | set Bubba.password }}'
```

> Quotes must surround passwords to prevent invalid YAML.

```http
GET / HTTP/1.1
host: the.one.com
authorization: Basic #{{ basic Bubba }}
```

### Custom functions

```typescript
import { Agent, Captures, type Functions } from '@toa.io/agent'

const functions: Functions = {
  duplicate: function(this: Captures, value: string): string {
    return value + value
  },
  append: function(this: Captures, value: string, arg: string): string {
    return value + arg
  }
}

const captures = new Captures(functions)
const agent = new Agent('http://localhost:8000', captures)
```

```http request
PUT / HTTP/1.1
content-type: application/yaml

foo: #{{ duplicate bar | append baz }}
```

In the above example, `foo` will be set to `barbarbaz`.
