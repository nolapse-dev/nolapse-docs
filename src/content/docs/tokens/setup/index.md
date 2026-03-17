---
title: "Token Setup"
description: What nolapse API tokens are, when you need them, and what to expect when token management ships.
---

nolapse API tokens authenticate requests to the nolapse platform. They are required when integrating nolapse's cloud features with CI — for example, when pushing coverage results to the platform or triggering remote enforcement checks.

:::note[Token endpoints are not yet live]
The token management API (POST /v1/tokens and related endpoints) is a planned feature tracked as story #34. The token management dashboard at `/admin` is tracked as story #46. This page documents the token system as it is designed, so you are ready to use it when it ships.
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
nlp_<40 alphanumeric characters>
```

Total length: **44 characters** (`nlp_` prefix + 40 character body).

Example (not a real token):

```text
nlp_aB3dE5fG7hJ9kL1mN2pQ4rS6tU8vW0xY2zA4bC
```

Tokens are case-sensitive. Store them as opaque strings — do not attempt to parse or decode the body.

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

## Creating a token (planned)

When story #34 ships, tokens will be created via:

```http
POST /v1/tokens
Authorization: Bearer <session-token>
Content-Type: application/json

{
  "name": "ci-main-branch",
  "scopes": ["execute"]
}
```

A successful response will return the token value once — it will not be retrievable again. Store it immediately in your CI secret manager.

The token management dashboard at `/admin` (story #46) will provide a UI for creating and revoking tokens without using the API directly.

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

## Listing tokens (planned)

```http
GET /v1/tokens
Authorization: Bearer <session-token>
```

Returns a list of tokens with their `id`, `name`, `status`, and `scopes` — but not the token value itself.

## Revoking a token (planned)

```http
DELETE /v1/tokens/{id}
Authorization: Bearer <session-token>
```

Revoked tokens are immediately invalid. For zero-downtime replacement, use [token rotation](/tokens/rotation/) instead.
