# Identity

Identity is the fundamental entity within an authentication system that represents the **unique
identifier** of an individual, organization, application or device.

To prove its Identity, the request originator must provide a valid _credentials_ that are associated
with that Identity.

Identity is intrinsically linked to credentials, as an Identity is established only when the first
set of credentials for that Identity is created.
In other words, the creation of credentials marks the inception of an Identity.
Once the last credentials are removed from the Identity, it ceases to exist.
Without credentials, there is no basis for defining or asserting an Identity.

## Authentication

The Authentication system resolves provided credentials to an Identity using one of the supported
authentication schemes.

The Authentication is request-agnostic, meaning it does not depend on the specific URL being
requested or the content of the request body.
The only information it handles is the value of the `Authorization` header.

> Except for its own [management resources](components.md).

If the provided credentials are not valid or not associated with an Identity, then Authentication
interrupts request processing and responds with an authentication error.

### Basic scheme

Classic username/password pair. See [RFC7617](https://datatracker.ietf.org/doc/html/rfc7617).

```http
Authorization: Basic aGVsbG86d29ybGQK
```

See [`identity.basic` component](components.md#basic-credentials).

### Token scheme

Tokens issued by the Authentication system. These tokens are [PASETO](https://paseto.io).

```http
Authrization: Token v4.local.eyJzdWIiOiJqb2hu...
```

The `Token` is the **primary** authentication scheme.
If request originators use an alternative authentication scheme, they will receive a response
containing `Token`credentials and will be required to switch to the `Token` scheme for any
subsequent requests.
Continued use of other authentication schemes will result in temporary blocking of requests.

See [`identity.tokens` component](components.md#stateless-tokens).

### Bearer scheme

OpenID tokens issued by trusted providers.
For more information, refer
to [OpenID Connect Core 1.0](https://openid.net/specs/openid-connect-core-1_0.html),
[RFC6750](https://datatracker.ietf.org/doc/html/rfc6750).

```http
Authorization: Bearer eyJhbGciOiJIUzI1...
```

Trusted providers are specified using the `identity.federation`  configuration.

```yaml
# context.toa.yaml

configuration:
  identity.federation:
    trust:
      - iss: https://accounts.google.com
        aud:
          - <GOOGLE_CLIENT_ID>

      - iss: https://appleid.apple.com

      - iss: private.entity
        secrets:
          HS384:
            key0: <THE-SECRET-STRING-FOR-HS384>
            key1: <THE-SECRET-STRING-FOR-HS384> # selected by `kid` in the JWT header
    principal:
      iss: https://accounts.google.com
      sub: 4218230498234
    implicit: true
```

`principal` specifies the values of the `iss` and `sub` claims of an Identity that will be granted
with a `system` role.

`implicit` indicates whether the Identity should be implicitly created when a valid token for a
non-existent Identity is provided (default `false`).

## Identity inception

The simplest way to establish a relationship between an Identity and an entity representing a user
is to synchronize their identifiers.

This can be achieved by using the `auth:incept` directive as follows:

```yaml
# manifest.toa.yaml
name: users

entity:
  schema:
    name: string

exposition:
  /:
    POST:
      incept: id
      endpoint: transit
```

The value of the `auth:incept` directive refers to the name of the response property that will be
returned by the `POST` operation, containing the created entity identifier.

A request with Identity inception must contain (non-existent) credentials that will be associated
with the created Identity.

```http
POST /users/
authorization: Basic dXNlcjpwYXNz
accept: application/yaml
content-type: application/yaml

name: John
```

```
201 Created
content-type: application/yaml

id: 2428c31ecb6e4a51a24ef52f0c4181b9
```

As a result of processing the above request, the provided Basic credentials associated with the
Identity `2428c31ecb6e4a51a24ef52f0c4181b9` are created.

> `auth:incept` directive may have a `null` value, which means that the Identity will be created
> without any associated entity.

## Issuing tokens for a response

Token can be issued for a response using the `auth:issue` directive, which specifies the name of the
response property that contain Identity identifier (string).

Request must not be authenticated.

```yaml
/users/:
  POST:
    auth:issue: id
    endpoint: create
```

```
POST /users/

name: User

---

201 Created
authorization: Token v4.local.eyJzdWIiOiJqb2hu...

id: 2428c31ecb6e4a51a24ef52f0c4181b9
name: User
```

## FAQ

<dl>
<dt>How can I log in a user?</dt>
<dd>
Technically speaking, since the Authentication is request-agnostic, user credentials
can be sent with any request.

However, it is most likely that a request originator will need to obtain an Identity value for
subsequent requests.
For this reason, it is recommended to make a `GET /identity/` request.
</dd>
<dt>How can I log out a user?</dt>
<dd>Delete <code>Token</code> credentials from the device.</dd>
<dt>Where are the sessions?</dt>
<dd>
The Authentication is stateless, meaning it does not store any information between
requests except for persistent credentials.</dd>
<dt>How can I pass the Identity to an operation call?</dt>
<dd>
This is not possible. Refer to the Resource Design Guidelines for more information.
<a href="https://github.com/toa-io/toa/issues/353">#353</a>
</dd>
</dl>
