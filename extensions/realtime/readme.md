# Toa Realtime

## Overview

<a href="https://miro.com/app/board/uXjVOoy0ImU=/?moveToWidget=3458764566111478378&cot=14">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset=".readme/overview-dark.jpg">
    <img alt="Realtime" width="700" height="202" src=".readme/overview-light.jpg">
  </picture>
</a>

Realtime extension combines application events into streams according to defined routes.
Clients may consume these streams [via Exposition](/extensions/exposition).

If stream is idle for 16 seconds, a `heartbeat` message is sent.

## Static routes

Static route specifies an event that should be combined into a stream using specified property of
event's payload as a stream key or an array of stream keys.

Static routes may be defined in Component manifest or the Context annotation.

```yaml
# manifest.toa.yaml

name: users

realtime:
  updated: id
```

```yaml
# context.toa.yaml

realtime:
  users.updated: id
  orders.created: customer_id
```

In case of conflict, the Context annotation takes precedence.

Multiple stream keys may be defined for a single event.

```yaml
# manifest.toa.yaml
name: messages

realtime:
  updated: [sender_id, recipient_id]
```

### Static route examples

Given two rules: `users.updated: id` and `orders.created: customer_id`,
the following events will be routed into a stream with `a4b8e7e8` key:

```yaml
# users.updated
id: a4b8e7e8 # id property is used as a stream key
name: John Doe
```

```yaml
# orders.created
id: 1
customer_id: a4b8e7e8 # customer_id property is used as a stream key
amount: 100
```

## Dynamic routes

![Not implemented](https://img.shields.io/badge/Not%20implemented-red)

Dynamic routes address the cases when a stream key is not a property of an event.

Among with an `event` and a `stream` key, a dynamic route has `property` and `value` properties,
which define a condition that should be met for an event to be combined into a stream with the
specified key.

### Dynamic route example

For instance, when there are chat rooms with a list of users, and a user joins or leaves the room.
When a message is sent to a room, an event will have a `room_id` property, but not a `user_id`.
In this case, when the user `a4b8e7e8` enters the room with id `general`,
a dynamic route may be created as follows:

```yaml
event: message.sent
property: room_id
value: general
stream: a4b8e7e8
```

Each time the message is sent to the room with id `general`, the event will be routed into a
stream with `a4b8e7e8` key.

### Managing dynamic routes

Dynamic routes are managed by the `realtime.routes` component, running in the Realtime extension.

## Exposition

Streams are exposed by the [`realtime.streams`](components/streams) component, running in the
Realtime extension, and are
accessible via the `/realtime/streams/:key/` resource with
the [`auth:id: key`](/extensions/exposition/documentation/access.md#id) authorization rule.

Refer to the [Exposition extension](/extensions/exposition) for more details:

- [Multipart responses](/extensions/exposition/documentation/protocol.md#multipart-types)
- [Access authorization](/extensions/exposition/documentation/access.md)
