---
title: Known Limitations
description: Current constraints, incomplete features, and behaviours to be aware of in nolapse v0.2.0.
---

This page documents known limitations in the current release — behaviours that are by design but may surprise users, features that are partially implemented, and constraints that will be resolved in future releases.

---

## Token management

### No token management dashboard yet

The `/admin` dashboard UI for creating and revoking tokens (story #46) is not yet live. Token management requires direct API calls or the CLI. See [Token Setup](/tokens/setup/).

### Token rotation grace period — fixed duration

Token rotation (`POST /v1/tokens/{id}/rotate`) immediately deactivates the old token; there is no configurable grace period in the current implementation. Both the old and new token are valid only during a brief in-process window. If you need overlap, create a second token before revoking the first.

### Scopes are `execute`-only

The only token scope currently defined is `execute`. Finer-grained scopes (read-only, admin, billing) are planned but not yet available. All tokens with `execute` scope have identical access within their org.

### Agent type is informational only

The `agent_type` field (`cursor`, `claude_code`, `github_copilot`, etc.) is recorded for analytics and feedback features but does not currently gate or modify any access control decisions.

---

## Session management

### No session listing or forced invalidation

There is no endpoint to list active sessions or force-invalidate all sessions for a user. Logging out (`DELETE /v1/sessions/{id}`) invalidates only the specific session. If a session token is compromised, the only remediation is to wait for the 24-hour TTL to expire or to delete the specific session if the ID is known.

### Session TTL is not configurable per-org

The session lifetime is fixed at 24 hours (maximum 7 days). Per-org or per-user TTL configuration is not supported.

---

## API / platform

### Rate limiting not yet enforced

No rate limits are currently applied to any endpoint. The intended model (60 req/min free tier, 600 req/min paid tier) is planned but not implemented. Abusive clients are not automatically throttled.

### Redis caching not yet integrated

Token validation results are not cached. Every `POST /v1/auth/validate` call hits the database directly. Under high load, this may cause elevated database query rates. Redis integration is planned.

### Revoked token grace period is zero

There is no grace period after token revocation — the token is invalid immediately. Clients using a revoked token will receive `401` on their next request. Ensure all consumers are updated before revoking.

---

## CORS

### ALLOWED_ORIGINS must be set for browser access

An empty or unset `ALLOWED_ORIGINS` means no browser client can make cross-origin requests to the API. This is intentional (fail-closed) but can catch self-hosted operators off-guard. If your dashboard loads but API calls fail with CORS errors, check that `ALLOWED_ORIGINS` is set and that the value exactly matches your dashboard's origin (scheme + host + port).

### Preflight OPTIONS requests always return 204

Preflight responses return `204 No Content` even for origins not in the allowlist. The browser will enforce the origin check based on the absent `Access-Control-Allow-Origin` header; this is correct behaviour but means the preflight itself succeeds for all origins at the network level.

---

## GitHub Action

### nolapse-token pre-flight adds latency

When `nolapse-token` is provided, the action calls `nolapse validate-token` before running coverage enforcement. This adds one network round-trip. For air-gapped runners, omit `nolapse-token` if the validation endpoint is unreachable.

### Threshold inputs are capped at 100

Threshold values above 100 are rejected by the action. Coverage percentages cannot exceed 100%, so this is not a practical constraint, but it may surprise users who configured `fail-threshold: '999'` as "never fail".

---

## Webhook handling

### No webhook event queuing

Webhook events are processed synchronously in the HTTP handler. If downstream processing (e.g. database writes) is slow or fails, the handler returns `500` and the webhook provider may retry. There is no queue or dead-letter store for failed events.

### Webhook replay protection requires a database

When `nolapse-api` starts without a database connection (e.g. in local development), the `WebhookStore` is `nil` and replay protection is disabled. Signature verification still runs. Set up a database for production to enable full replay protection.

---

## Runner environment

### Allowlist may be incomplete for unusual toolchains

The runner environment allowlist (`runners/env_filter.py`) covers common build-tool variables. If your tests depend on a non-standard environment variable (e.g. a custom `MY_SDK_HOME`), the variable will be stripped and your tests may fail unexpectedly. Add the variable to the allowlist in `env_filter.py` or set it in your CI environment in a way the test framework reads from a config file rather than env.

### Python runner requires pytest-cov in the same venv

The Python runner invokes `pytest` and expects `pytest-cov` to be installed in the active virtual environment. If your tests use a different coverage tool (e.g. `coverage run`), the runner will not produce results. Use the [custom runner](/languages/custom/) pattern instead.

---

## Observability

### Audit logs are stdout only

`[audit]` log lines are written to stdout via `log.Printf`. There is no structured JSON format, no log levels, and no built-in integration with log aggregation platforms (Datadog, CloudWatch, etc.). Pipe stdout to your log aggregator and filter on `[audit]` for security event streams.

### No metrics endpoint

There is no `/metrics` (Prometheus) or equivalent endpoint. Infrastructure monitoring requires log-based metrics or external instrumentation.
