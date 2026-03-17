---
title: Auth API
description: Full reference for POST /v1/auth/validate — validate a token and retrieve org ID and scopes.
---

`POST /v1/auth/validate` checks whether a token string is valid and, if so, returns the associated org ID and granted scopes. The CLI calls this endpoint on startup when `NOLAPSE_TOKEN` is set, and the dashboard calls it to verify tokens entered in the settings UI.

:::note[Implementation status]
This endpoint is **planned** — story [#34](https://github.com/nolapse-dev/nolapse-platform/issues/34). It currently returns `501 Not Implemented`. The spec below is final and will not change before implementation.
:::

---

## Endpoint

```text
POST /v1/auth/validate
Content-Type: application/json
```

No `Authorization` header is required — the token to validate is passed in the request body.

---

## Request Body

```json
{
  "token": "nlp_aBcDeFgHiJkLmNoPqRsTuVwXyZ0123456789ab"
}
```

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `token` | string | yes | The token string to validate. Must begin with `nlp_` followed by exactly 40 alphanumeric characters. |

### Token Format Rules

A valid nolapse token has the following structure:

```text
nlp_<40 alphanumeric characters>
```

- Total length: 44 characters (`nlp_` prefix + 40-character body)
- The 40-character body contains only `[A-Za-z0-9]` — no hyphens, underscores, or special characters
- Tokens are generated server-side using a cryptographically secure random generator
- The prefix `nlp_` allows secret-scanning tools (e.g. GitHub Secret Scanning) to detect accidentally committed tokens

A request body where `token` is missing or is not a string returns `400`. A request body where the token string is syntactically valid but not recognised by the server returns `401`.

---

## Responses

### 200 OK — Valid token

```json
{
  "valid": true,
  "org_id": "org_01hv5kp9aqz1y3mx4nfd8zbjrc",
  "scopes": ["execute"]
}
```

| Field | Type | Description |
| --- | --- | --- |
| `valid` | boolean | Always `true` on a 200 response |
| `org_id` | string | Opaque identifier for the organisation that owns this token |
| `scopes` | string[] | Scopes granted to the token. Currently the only defined scope is `execute`. |

### 401 Unauthorized — Invalid or revoked token

```json
{
  "error": "invalid token"
}
```

Returned when the token string is syntactically correct but is not found in the token store, has been revoked, or has been rotated past its grace period.

### 400 Bad Request — Malformed request

```json
{
  "error": "malformed request"
}
```

Returned when the request body is missing the `token` field, the field is not a string, or the body is not valid JSON.

---

## Example Request

```bash
curl -s -X POST https://api.nolapse.dev/v1/auth/validate \
  -H "Content-Type: application/json" \
  -d '{"token":"nlp_aBcDeFgHiJkLmNoPqRsTuVwXyZ0123456789ab"}' | jq
```

```json
{
  "valid": true,
  "org_id": "org_01hv5kp9aqz1y3mx4nfd8zbjrc",
  "scopes": ["execute"]
}
```

---

## Caching (Planned)

To reduce database load, validation results will be cached in Redis with a 60-second TTL. This means:

- A newly created token becomes usable within 60 seconds of creation.
- A revoked token may continue to validate for up to 60 seconds after revocation.
- A rotated token's old value remains valid until the grace period expires (see [Token Rotation](/tokens/rotation/)), regardless of cache TTL.

Cache bypassing will not be exposed through the public API.

---

## Scopes

The `scopes` array in the response describes what the token is authorised to do. The current scope model:

| Scope | Grants |
| --- | --- |
| `execute` | Run `nolapse run`, submit execution records, read baseline data |

Additional scopes (e.g. `admin`, `read`) are planned for future tiers.

---

## See Also

- [API Overview](/api/overview/) — all endpoints, base URL, and middleware
- [Token Setup](/tokens/setup/) — how to create tokens via the dashboard or API
- [Token Rotation](/tokens/rotation/) — rotate tokens with a grace period
