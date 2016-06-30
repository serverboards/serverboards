# REAUTH

For some operations a specific auth may be required.

The middleware that performs the JSON calls must be prepared for this operation,
but it can be expected only on interactive clients.

## First request, needs reauth

```js
{
  method: "foo",
  params: [],
  id: 1
}
```

can be returned with. This means the client is required to authenticat this
request or cancel it.

```js
{
  error: {
    type: "needs_reauth",
    description: "Foobricate is a restricted operation.",
    available: ["totp"],
    uuid: "491d4e8b-d742-4514-84bc-5b2ecf79afb1"
  }
  id: 1
}
```

## How to confirm the operation

The client them must send:

```js
{
  method: "auth.reauth",
  params: {
    uuid: "491d4e8b-d742-4514-84bc-5b2ecf79afb1",
    data: {
      type: "topt",
      token: "1234"
    }
  },
  id: 2
}
```

And the server will reply with the result of the intended request.

```js
{
  result: "bar",
  id: 2
}
```

or again a request to reauth if not valid. Same UUID.

## Cancel the request

Alternatively can cancel the request:

```js
{
  method: "auth.reauth",
  params: {
    uuid: "491d4e8b-d742-4514-84bc-5b2ecf79afb1",
    type: "cancel",
  },
  id: 2
}
```

And the server will reply with the result of the intended request.

```js
{
  error: "cancelled",
  id: 2
}
```

It folows this flow to avoid long waits for auth confirmations.
