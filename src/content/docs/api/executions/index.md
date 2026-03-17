---
title: Executions API
description: Reference for GET /v1/executions — list execution records for a repository, used by the onboarding flow and dashboard.
---

`GET /v1/executions` returns a paginated list of `nolapse run` execution records for a given repository. The onboarding flow polls this endpoint to confirm the first successful run. The dashboard uses it to render the coverage history chart.

:::note[Implementation status]
This endpoint is **planned** — story [#47](https://github.com/nolapse-dev/nolapse-platform/issues/47). It currently returns `501 Not Implemented`. The spec below is final.
:::

---

## Endpoint

```text
GET /v1/executions?org=<slug>&repo=<name>&limit=10
Authorization: Bearer nlp_<token>
```

Authentication is required. The token must carry the `execute` scope.

---

## Query Parameters

| Parameter | Type | Required | Description |
| --- | --- | --- | --- |
| `org` | string | yes | Organisation slug (e.g. `acme`). Must match the org associated with the token. |
| `repo` | string | yes | Repository name (e.g. `api-service`). Case-sensitive. |
| `limit` | integer | no | Maximum number of records to return. Defaults to `10`. Maximum `100`. |

---

## Response — 200 OK

```json
{
  "executions": [
    {
      "id": "exe_01hwk3r9btz0y5qp7njf2xcm8d",
      "repo": "api-service",
      "branch": "main",
      "outcome": "pass",
      "delta": "+2.30",
      "created_at": "2026-03-18T09:00:00Z"
    },
    {
      "id": "exe_01hwk1p4aqz2v6nx0mgd9ybj5e",
      "repo": "api-service",
      "branch": "feat/auth",
      "outcome": "warn",
      "delta": "-0.40",
      "created_at": "2026-03-17T14:22:10Z"
    }
  ],
  "total": 5
}
```

### Response Object Fields

| Field | Type | Description |
| --- | --- | --- |
| `executions` | array | Ordered from most recent to oldest. Length is at most `limit`. |
| `total` | integer | Total number of execution records for the repo, regardless of `limit`. Useful for pagination UI. |

### Execution Object Fields

| Field | Type | Description |
| --- | --- | --- |
| `id` | string | Opaque execution identifier. Prefixed `exe_`. |
| `repo` | string | Repository name this execution ran against. |
| `branch` | string | Git branch name at the time of the run. |
| `outcome` | string | One of `"pass"`, `"warn"`, or `"fail"`. See outcome definitions below. |
| `delta` | string | Signed percentage-point change relative to the baseline. E.g. `"+2.30"`, `"-0.40"`, `"0.00"`. String type preserves sign for zero-delta cases. |
| `created_at` | string | ISO 8601 UTC timestamp of when the execution was recorded. |

### Outcome Definitions

| Outcome | Meaning |
| --- | --- |
| `pass` | Coverage delta is within or above all thresholds |
| `warn` | Delta exceeded the warn threshold but not the fail threshold |
| `fail` | Delta exceeded the fail threshold; the CLI exited with code 1 |

---

## Error Responses

| Status | Body | Cause |
| --- | --- | --- |
| 400 | `{"error":"missing required parameter: org"}` | `org` or `repo` query param absent |
| 401 | `{"error":"invalid token"}` | Token missing, invalid, or revoked |
| 403 | `{"error":"forbidden"}` | Token's org does not match `org` param |
| 501 | `{"error":"not implemented"}` | Endpoint not yet live |

---

## Example Request

```bash
curl -s \
  -H "Authorization: Bearer nlp_aBcDeFgHiJkLmNoPqRsTuVwXyZ0123456789ab" \
  "https://api.nolapse.dev/v1/executions?org=acme&repo=api-service&limit=5" \
  | jq
```

---

## Onboarding Flow Usage

The nolapse onboarding wizard polls `GET /v1/executions` after you add the GitHub Action and open your first pull request. It waits for `total` to become `> 0`, then displays the first execution's outcome and delta. Polling interval is 5 seconds with a 10-minute timeout.

---

## Pagination

The `limit` parameter provides simple top-N access. Cursor-based pagination is planned for a future release. For now, use `total` to determine whether records were truncated:

```js
if (response.total > response.executions.length) {
  // more records exist; increase limit or implement cursor pagination
}
```

---

## See Also

- [API Overview](/api/overview/) — all endpoints and base URL
- [Auth API](/api/auth/) — token validation reference
- [Plans & Pricing](/billing/plans/) — execution history retention per plan
