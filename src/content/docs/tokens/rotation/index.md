---
title: "Token Rotation"
description: How nolapse token rotation works — grace period, status transitions, and zero-downtime replacement.
---

Token rotation lets you replace an active token without any window of downtime. During the rotation grace period, both the old and new tokens are accepted, giving you time to update all consumers before the old token is revoked.

:::note[Planned feature — story #34]
Token rotation is part of the token management API tracked as story #34. The endpoints described on this page are not yet live.
:::

## Why rotate tokens

- **Routine security hygiene** — rotate tokens on a schedule (e.g., every 90 days) to limit the exposure window if a token is ever compromised.
- **Personnel changes** — when a team member who had access to a token leaves, rotate to ensure their copy is no longer valid.
- **Suspected compromise** — if a token may have been exposed in logs or a public commit, rotate immediately.

## How rotation works

Rotation follows a three-status lifecycle:

```text
active → rotating → revoked
```

1. **`active`** — the token is in normal use and valid for all authenticated requests.
2. **`rotating`** — the rotation has been initiated. The old token is still accepted. A new token has been issued.
3. **`revoked`** — the old token is permanently invalid. Only the new token works.

## Initiating a rotation

```http
POST /v1/tokens/{id}/rotate
Authorization: Bearer <session-token>
```

A successful response returns the **new token value** — this is the only time it is shown:

```json
{
  "new_token": "nlp_xY9zA1bC3dE5fG7hJ0kL2mN4pQ6rS8tU1vW3xY",
  "old_token_id": "tok_abc123",
  "old_token_status": "rotating",
  "grace_period_ends_at": "2026-03-19T14:00:00Z"
}
```

Store the new token value immediately. It cannot be retrieved again.

## Grace period

During the grace period, the old token's status is `rotating` and it remains valid. This gives you time to:

1. Update your CI secrets with the new token value.
2. Redeploy any services that use the token.
3. Verify the new token works by checking `POST /v1/auth/validate`.

The grace period duration is set by the platform (exact duration will be documented when story #34 ships). Once the grace period ends, the old token's status transitions to `revoked` automatically.

## Completing the rotation early

If you want to revoke the old token before the grace period expires — for example, after confirming all consumers have been updated — delete the old token:

```http
DELETE /v1/tokens/{id}
Authorization: Bearer <session-token>
```

This immediately transitions the old token to `revoked`.

## Status reference

| Status     | Old token valid? | New token valid? | Description                              |
| ---------- | ---------------- | ---------------- | ---------------------------------------- |
| `active`   | Yes              | N/A              | Normal operating state                   |
| `rotating` | Yes              | Yes              | Grace period — both tokens accepted      |
| `revoked`  | No               | Yes              | Rotation complete, old token invalidated |

## Checking token status

```http
GET /v1/tokens/{id}
Authorization: Bearer <session-token>
```

Returns the token metadata including current `status`. Use this to confirm a rotation has completed.

## Recommended rotation workflow

1. Call `POST /v1/tokens/{id}/rotate` and copy the new token value.
2. Update the `NOLAPSE_TOKEN` secret in your CI platform (GitHub Actions secrets, GitLab CI variables, etc.).
3. Trigger a test CI run to confirm the new token authenticates successfully.
4. Wait for the grace period to expire, or call `DELETE /v1/tokens/{old_id}` to revoke the old token immediately.
5. Confirm via `GET /v1/tokens/{old_id}` that the old token's status is `revoked`.
