---
title: "Token Setup"
description: What nolapse API tokens are, when you need them, and what to expect when token management ships.
---

nolapse API tokens authenticate requests to the nolapse platform. They are required when integrating nolapse's cloud features with CI — for example, when pushing coverage results to the platform or triggering remote enforcement checks.

:::note[Token management dashboard]
The token management dashboard at `/admin` (story #46) is still in progress. Tokens can be managed via the API endpoints described on this page.
:::

## When you need a token

The nolapse CLI can run entirely locally — `nolapse init`, `nolapse run`, and `nolapse baseline update` do not require a token when used purely as a local enforcement tool.

You need a token when:

- Sending coverage results to the nolapse platform for dashboarding or cross-repo reporting.
- Authenticating CI jobs against the nolapse API.
- Using any endpoint under `/v1/` from a script or CI pipeline.

## Token format

All nolapse tokens follow this format:

```text
nlp_<40 lowercase hex characters>
```

Total length: **44 characters** (`nlp_` prefix + 40 lowercase hex character body).

Example (not a real token):

```text
nlp_3f7a2c1b0e4d9a8f5c6b2e1d0a3f7c4b9e2d1a0f
```

Tokens are lowercase-only. Store them as opaque strings — do not attempt to parse or decode the body. The raw token value is shown exactly once at creation time; the platform stores only a bcrypt hash and never the raw value.

## Token validation

The platform validates tokens via:

```http
POST /v1/auth/validate
Content-Type: application/json

{"token": "nlp_aB3dE5fG7hJ9kL1mN2pQ4rS6tU8vW0xY2zA4bC"}
```

A valid token returns:

```json
{
  "valid": true,
  "org_id": "org_abc123",
  "scopes": ["execute"]
}
```

An invalid or revoked token returns `"valid": false`.

## Creating a token

Tokens are created via:

```http
POST /v1/tokens
Authorization: Bearer <session-token>
Content-Type: application/json

{
  "name": "ci-main-branch",
  "scopes": ["execute"]
}
```

A successful `201 Created` response returns the token value once — **it will not be retrievable again**. Store it immediately in your CI secret manager.

```json
{
  "id": "3f7a2c1b-0e4d-9a8f-5c6b-2e1d0a3f7c4b",
  "secret": "nlp_3f7a2c1b0e4d9a8f5c6b2e1d0a3f7c4b9e2d1a0f",
  "name": "ci-main-branch",
  "scopes": ["execute"],
  "agent_type": ""
}
```

The `org_id` is always derived from the authenticated session — any `org_id` field in the request body is ignored.

## Adding a token to CI

Once you have a token, add it as a CI secret. The recommended environment variable name is `NOLAPSE_TOKEN`.

### GitHub Actions

```yaml
# .github/workflows/coverage.yml
- name: Run nolapse
  env:
    NOLAPSE_TOKEN: ${{ secrets.NOLAPSE_TOKEN }}
  run: nolapse run --repo .
```

Add the secret under **Settings → Secrets and variables → Actions** in your GitHub repository.

### GitLab CI

```yaml
# .gitlab-ci.yml
coverage:
  script:
    - nolapse run --repo .
  variables:
    NOLAPSE_TOKEN: $NOLAPSE_TOKEN
```

Add `NOLAPSE_TOKEN` as a masked CI/CD variable under **Settings → CI/CD → Variables**.

## Listing tokens

```http
GET /v1/tokens
Authorization: Bearer <session-token>
```

Returns a list of tokens scoped to the authenticated session's org. Token values are never returned — only `id`, `name`, `status`, `scopes`, and `agent_type`.

## Revoking a token

```http
DELETE /v1/tokens/{id}
Authorization: Bearer <session-token>
```

Returns `204 No Content`. Revoked tokens are immediately invalid. For zero-downtime replacement, use [token rotation](/tokens/rotation/) instead.
