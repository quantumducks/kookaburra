# HTTP context mapping

The `map` directive family is used to map HTTP request parts to operation call input properties.

[Features](../features/map.feature).

## TL;DR

```yaml
exposition:
  /:group:
    languages: [en, fr]   # supported languages
    GET:
      map:authority: hostname # request authority (e.g., hostname)
      map:language: lang      # requested language
      map:headers: # raw header values
        token: x-access-token
      map:segments: # route parameters
        group: group
      map:claims: # Bearer token claims
        address: email
        verified: email_verified
      endpoint: observe
```

The operation input type must be an object.
If the input already contains the specified keys, they will be overwritten.

## Authority

The `map:authority` directive maps the [authority identifier](authorities.md) to an operation call
input property specified by the directive value.

### Language

The `map:language` mapping sets the [most matching](https://github.com/jshttp/negotiator) language
code based on the `accept-language` request header and a list of supported languages defined by
the `map:languages` directive, and also adds `accept-language` to the `Vary` HTTP response header
value.

If none of the supported languages match, the first supported language is used.

> `map:languages` has a shorthand form: `languages: [en, fr]`.

## Header values

The `map:headers` directive maps the values of HTTP request headers to operation call input
properties.
The value of the directive is a map where keys are the names of the input properties and values are
the names of the HTTP request headers.

The names of these headers are then included in the `Vary` HTTP response header
and [Access-Control-Allow-Headers](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Access-Control-Allow-Headers)
of the [CORS](protocol.md#cors).

[Multiple header fields](https://www.w3.org/Protocols/rfc2616/rfc2616-sec4.html#sec4.2) are combined
as a comma-separated list.

## Route parameters

The `map:segments` directive maps the values of route parameters to operation call input properties.
The value of the directive is a map where keys are the names of the input properties, and values are
the names of the route parameters.

> The mapped segment is no longer available to remaining directives, nor used as criteria in the
> operation call.

## Bearer token claims

The `map:claims` directive maps the values of
the [token claims](https://datatracker.ietf.org/doc/html/rfc7519#section-4).
The value of the directive is a map where keys are the names of the input properties and values are
the names of the claims.

If the claim is not present in the token or the request is not authenticated using
the [`Bearer` scheme](identity.md#bearer-scheme), the input properties are not set.
