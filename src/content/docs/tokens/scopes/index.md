---
title: "Token Scopes"
description: Available nolapse token scopes, what each one permits, and how scopes are assigned at token creation.
---

Token scopes define what a token is allowed to do. Scopes are set when a token is created and cannot be changed afterwards — to change scopes, create a new token with the desired permissions and revoke the old one.

:::note[Planned feature — story #34]
Token management (including scope assignment) is part of the token management API tracked as story #34. The endpoints described on this page are not yet live.
:::

## Available scopes

### `execute`

Permits the token to run coverage enforcement operations via the nolapse API. This is the scope required for CI jobs that call `nolapse run` against the platform.

What `execute` allows:

- Submitting coverage results to the platform.
- Triggering remote enforcement checks.
- Reading enforcement outcomes for the authenticated organisation.

What `execute` does not allow:

- Creating, rotating, or revoking tokens.
- Modifying organisation settings.
- Accessing billing or usage data.

## Scope assignment

Scopes are specified at token creation time:

```http
POST /v1/tokens
Authorization: Bearer <session-token>
Content-Type: application/json

{
  "name": "ci-main-branch",
  "scopes": ["execute"]
}
```

## Validating a token's scopes

When a token is validated, the response includes the scopes it carries:

```http
POST /v1/auth/validate
Content-Type: application/json

{"token": "nlp_aB3dE5fG7hJ9kL1mN2pQ4rS6tU8vW0xY2zA4bC"}
```

Response:

```json
{
  "valid": true,
  "org_id": "org_abc123",
  "scopes": ["execute"]
}
```

If a token attempts an operation outside its granted scopes, the API returns `403 Forbidden`.

## Listing token scopes

When you retrieve a token via the API, the `scopes` field is always included:

```http
GET /v1/tokens/{id}
Authorization: Bearer <session-token>
```

Response:

```json
{
  "id": "tok_abc123",
  "name": "ci-main-branch",
  "status": "active",
  "scopes": ["execute"],
  "created_at": "2026-01-15T09:32:11Z"
}
```

## Principle of least privilege

Always grant the minimum scope needed. For CI jobs that only run coverage enforcement, `execute` is sufficient. Do not create tokens with broader permissions than required, even if finer-grained scopes are not yet available.

## Planned: finer-grained scopes

The current `execute` scope covers all enforcement operations as a single permission. Finer-grained scopes — for example, separating read-only result access from the ability to trigger enforcement runs — are planned for a future release. This page will be updated when additional scopes are introduced.
