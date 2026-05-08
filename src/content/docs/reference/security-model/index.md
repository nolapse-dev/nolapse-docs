---
title: Security Model
description: How nolapse protects tokens, sessions, webhooks, and CI runner environments — threat mitigations and deployment configuration.
---

This page describes the security model of the nolapse platform: the threats it defends against, the mechanisms used, and what self-hosted operators need to configure.

---

## Token security

### Storage — hash only

nolapse API tokens are **never stored in the database in plaintext**. At creation time:

1. The raw token value is returned to the caller (once only).
2. A bcrypt hash (cost 12) of the raw value is stored in `api_tokens.secret_hash`.
3. The raw value is discarded and is unrecoverable.

On validation (`POST /v1/auth/validate`), the UUID embedded in the token prefix is used for an O(1) primary-key lookup (`SELECT WHERE id = $1`), then `bcrypt.CompareHashAndPassword` is called in constant time. If the database is compromised, the attacker obtains only bcrypt hashes — not usable token values.

### Token format

```text
nlp_<32 hex chars (UUID, no hyphens)><8 hex chars (random)>
```

Total: 44 characters. The first 32 hex chars encode the UUID primary key for fast lookup; the trailing 8 are extra entropy. All chars are lowercase hex `[0-9a-f]`.

The `nlp_` prefix enables **GitHub Secret Scanning** and equivalent tools to detect accidentally committed tokens before they can be used.

### Constant-time comparison

All token comparisons use `hmac.Equal` or `bcrypt.CompareHashAndPassword` to prevent timing attacks.

---

## Session security

### Service-to-service auth (`SERVICE_TOKEN`)

`POST /v1/sessions/create` is an internal endpoint called only by `nolapse-web`. It is protected by a shared `SERVICE_TOKEN` — a pre-shared secret that `nolapse-web` presents as a Bearer token. Requests without this token receive `401`.

Set `SERVICE_TOKEN` to a random value (e.g. `openssl rand -hex 32`) and ensure it matches in both `nolapse-api` and `nolapse-web`.

### Server-enforced TTL

The session TTL is set server-side (24 hours default, 7 days maximum). Clients cannot supply or extend the TTL. Any `ttl` field in the request body is ignored.

### OAuth CSRF protection

The OAuth 2.0 GitHub login flow uses a `state` parameter:

1. `GET /auth/github` generates a 32-byte random state, stores it in an `httpOnly`/`SameSite=Lax` cookie, and redirects to GitHub.
2. On callback, the state in the query string is compared to the cookie value. Mismatch → `400`.
3. The cookie is cleared after a single use.

This prevents cross-site request forgery during the OAuth flow.

---

## Webhook security

### Signature verification (fail-closed)

Both Stripe and Razorpay webhook handlers verify the request signature before processing any payload.

| Handler | Header | Algorithm |
| --- | --- | --- |
| Stripe | `Stripe-Signature` | HMAC-SHA256 of `<timestamp>.<body>` |
| Razorpay | `X-Razorpay-Signature` | HMAC-SHA256 of raw body |

If the signature header is absent → `401`. If the webhook secret env var is not set → `500` (fail-closed, not silently accept). Signature mismatch → `401`.

### Timestamp tolerance (Stripe)

Stripe signatures include a timestamp. The handler rejects events where `|now - timestamp| > 5 minutes` to prevent replay of old but valid signatures.

### Replay protection

All webhook handlers accept a `WebhookStore` that records `(provider, event_id)` pairs in the `webhook_events` table using `INSERT … ON CONFLICT DO NOTHING`. Duplicate events return `200` (idempotent) but are not processed again.

### Required env vars

| Var | Required | Description |
| --- | --- | --- |
| `STRIPE_WEBHOOK_SECRET` | If using Stripe | Signing secret from Stripe Dashboard → Developers → Webhooks |
| `RAZORPAY_WEBHOOK_SECRET` | If using Razorpay | Secret from Razorpay Dashboard → Webhooks |

---

## CORS policy

The CORS middleware uses an **origin allowlist** — not a wildcard. Only origins explicitly listed in `ALLOWED_ORIGINS` receive `Access-Control-Allow-Origin` headers. Requests from unlisted origins receive no CORS headers (browsers will block them).

`Vary: Origin` is always set to prevent cache poisoning across origins.

### Configuration

```bash
# .env (nolapse-api)
ALLOWED_ORIGINS=https://app.example.com,https://admin.example.com
```

- Comma-separated list of full origins (scheme + host + optional port).
- No trailing slashes.
- No wildcards (`*` is not accepted).
- An empty or unset `ALLOWED_ORIGINS` means **no origin is allowed** (fail-closed). This will break browser-based dashboard access — set it explicitly.

---

## Runner environment isolation

When nolapse runs user test code (via `go test`, `pytest`, `rspec`, `cargo test`, etc.), the subprocess environment is filtered through an allowlist (`runners/env_filter.py`). Only variables needed by build tools are forwarded:

- Shell basics: `PATH`, `HOME`, `USER`, `TMPDIR`, etc.
- Language toolchain vars: `GOPATH`, `JAVA_HOME`, `CARGO_HOME`, `VIRTUAL_ENV`, etc.
- CI markers: `CI`, `GITHUB_ACTIONS`

Platform secrets (`DATABASE_URL`, `SERVICE_TOKEN`, `STRIPE_WEBHOOK_SECRET`, `RAZORPAY_WEBHOOK_SECRET`, `SESSION_SECRET`, `REDIS_URL`) are **never forwarded** to subprocess environments. This prevents user test code from reading nolapse platform credentials.

---

## Audit logging

The platform emits structured log lines with the `[audit]` prefix for all security-relevant events. These can be filtered from server logs for SIEM ingestion or alerting.

| Event | Log line pattern |
| --- | --- |
| Session created | `[audit] session.create user_id=X org_id=Y session_id=Z` |
| Session deleted | `[audit] session.delete session_id=Z` |
| Session create denied | `[audit] session.create.denied reason=invalid_service_token remote=A.B.C.D` |
| Auth denied (middleware) | `[audit] auth.denied method=GET path=/v1/tokens reason=missing_token remote=A.B.C.D` |
| Auth denied (expired) | `[audit] auth.denied method=GET path=/v1/tokens reason=invalid_or_expired_token remote=A.B.C.D` |
| Token created | `[audit] token.create org_id=X token_id=Y scopes=[execute] agent_type=""` |
| Token rotated | `[audit] token.rotate old_id=X new_id=Y` |
| Token revoked | `[audit] token.revoke token_id=X` |

Infrastructure errors (database failures, etc.) are logged with the `[sessions]`, `[tokens]`, or `[organisations]` prefix separately and never appear in HTTP response bodies.

---

## Error responses

Internal errors (database failures, unexpected panics) return an opaque `"internal error"` response body with HTTP `500`. Full error details are logged server-side but never sent to the client. This prevents information leakage (stack traces, SQL errors, database hostnames) to potential attackers.

---

## Threat model summary

| Threat | Mitigation |
| --- | --- |
| Database compromise | Bcrypt-hashed tokens at cost 12 — raw values unrecoverable |
| Timing attacks on token validation | `hmac.Equal` and `bcrypt.CompareHashAndPassword` (constant-time) |
| Cross-org data access via query params | `org_id` always sourced from authenticated session, never from request |
| Session hijacking | `httpOnly` cookies, server-enforced TTL, session invalidation on logout |
| OAuth CSRF | Random `state` in `httpOnly` cookie, validated on callback, single-use |
| Webhook replay | `(provider, event_id)` deduplication in `webhook_events` table |
| Webhook forgery | HMAC-SHA256 signature verification, fail-closed on missing secret |
| Stale webhook replay (Stripe) | 5-minute timestamp tolerance window |
| CORS-based cross-origin access | Origin allowlist, no wildcard, `Vary: Origin` |
| Secret leakage to user test code | Runner subprocess env filtered to build-tool allowlist |
| Error detail leakage in HTTP responses | Opaque 500 bodies, details logged server-side only |
| GitHub Action input injection | Inputs passed via env vars, numeric validation, bash array args |
| SERVICE_TOKEN forgery | Pre-shared secret required on `POST /v1/sessions/create` |

---

## Self-hosted deployment checklist

Before deploying nolapse in production:

- [ ] Set `SERVICE_TOKEN` to `openssl rand -hex 32` — same value in `nolapse-api` and `nolapse-web`
- [ ] Set `SESSION_SECRET` to a random value
- [ ] Set `ALLOWED_ORIGINS` to the origin(s) of your dashboard
- [ ] Set `STRIPE_WEBHOOK_SECRET` if using Stripe billing
- [ ] Set `RAZORPAY_WEBHOOK_SECRET` if using Razorpay billing
- [ ] Confirm `DATABASE_URL` uses TLS (`sslmode=require` or `sslmode=verify-full`)
- [ ] Rotate all secrets on a schedule (90-day recommended)
