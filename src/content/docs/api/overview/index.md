---
title: API Overview
description: Base URL, authentication, request format, and a full index of every nolapse Platform API endpoint.
---

The nolapse Platform API is a JSON REST API that backs the dashboard, the CLI token commands, the badge CDN, and the executions feed. This page covers the base URL, authentication scheme, request/response format, and a complete endpoint index.

---

## Base URL

| Deployment | Base URL |
| --- | --- |
| Self-hosted | `http://localhost:8080` (default dev port) |
| Cloud (planned) | `https://api.nolapse.dev` |

All endpoints are versioned under `/v1/`. The health check lives at the root with no version prefix.

---

## Authentication

Authenticated endpoints require a Bearer token in the `Authorization` header:

```http
Authorization: Bearer nlp_<40-character-alphanumeric-string>
```

Tokens are created via the dashboard or via `POST /v1/tokens`. Every token carries one or more **scopes** that limit what it can do. The only scope currently defined is `execute`.

Unauthenticated requests to protected endpoints receive `401 Unauthorized`.

---

## Request and Response Format

- All request bodies must be `Content-Type: application/json`.
- All responses are `Content-Type: application/json` unless the endpoint explicitly returns another type (e.g. the badge endpoint returns `image/svg+xml`).
- Timestamps are ISO 8601 UTC strings: `"2026-03-18T09:00:00Z"`.
- Error responses follow the shape `{"error":"<message>"}`.

---

## Middleware

All routes share:

| Middleware | Behaviour |
| --- | --- |
| CORS | `Access-Control-Allow-Origin: *` on every response |
| Request ID | `X-Request-ID` header injected on every response |
| Logger | Structured access log line per request |

---

## Endpoint Index

| Method | Path | Description | Status |
| --- | --- | --- | --- |
| `GET` | `/health` | Liveness check — returns `{"status":"ok"}` | **Live** |
| `POST` | `/v1/auth/validate` | Validate a token, return org and scopes | Planned — story #34 |
| `GET` | `/v1/tokens` | List tokens for the authenticated org | Planned — story #34 |
| `POST` | `/v1/tokens` | Create a new token | Planned — story #34 |
| `POST` | `/v1/tokens/{id}/rotate` | Rotate a token with a grace period | Planned — story #34 |
| `DELETE` | `/v1/tokens/{id}` | Revoke a token | Planned — story #34 |
| `GET` | `/v1/badge/{org}/{repo}` | Return an SVG coverage badge | Planned — story #44 |
| `GET` | `/v1/executions` | List execution records for a repo | Planned — story #47 |

Unimplemented endpoints return `501 Not Implemented`.

---

## Health Check

The only fully live endpoint. No authentication required.

```http
GET /health
```

### Response — 200 OK

```json
{"status":"ok"}
```

Use this endpoint to verify the server is running before making other requests:

```bash
curl http://localhost:8080/health
# {"status":"ok"}
```

---

## Rate Limits

Rate limiting is planned. No limits are enforced today. The intended model is:

- Free tier: 60 requests / minute per token
- Team tier: 600 requests / minute per token
- Enterprise tier: custom

`429 Too Many Requests` will be returned when limits are exceeded, with a `Retry-After` header.

---

## See Also

- [Auth API](/api/auth/) — full reference for `POST /v1/auth/validate`
- [Executions API](/api/executions/) — full reference for `GET /v1/executions`
- [Token Setup](/tokens/setup/) — how to create and manage tokens
- [Token Rotation](/tokens/rotation/) — rotating tokens without downtime
