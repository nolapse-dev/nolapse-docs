---
title: Usage & Limits
description: Repo limits, token limits, concurrent jobs, execution history retention, and what happens when you exceed a limit.
---

Each nolapse plan enforces three types of limits: repository count, token count, and concurrent runner jobs. This page explains how each limit works, how usage is measured, and what happens when a limit is reached.

---

## Repository Limit

A "repository" in nolapse is any directory initialised with `nolapse init`. Each call to `nolapse init` registers a repo slug with your organisation.

| Plan | Repository limit |
| --- | --- |
| Free | 10 |
| Team | 100 |
| Enterprise | Unlimited |

Running `nolapse init` on a repo that is already registered does not consume a new slot. The limit applies to distinct repos — counted by `(org, repo_name)` pair.

When you reach your repo limit, any attempt to initialise a new repo returns:

```text
error: repository limit reached for your plan (10/10 repos used)
Upgrade to Team to track up to 100 repositories.
```

Existing repos are unaffected. They continue to accept `nolapse run` executions normally.

---

## Token Limit

| Plan | Tokens per organisation |
| --- | --- |
| Free | 1 |
| Team | 10 |
| Enterprise | Unlimited |

The token limit applies to **active** tokens. Tokens in `rotating` status (within their grace period) count toward the limit. Revoked tokens do not.

When you reach the token limit, `POST /v1/tokens` returns `402 Payment Required`:

```json
{
  "error": "token limit reached for your plan (1/1 tokens used). Upgrade to create more tokens."
}
```

To free up a slot without upgrading, revoke an existing token with `DELETE /v1/tokens/{id}`.

---

## Concurrent Runner Jobs

On the cloud deployment, nolapse processes `nolapse run` submissions through a job queue. The concurrency limit determines how many jobs execute simultaneously for your organisation.

| Plan | Concurrent jobs |
| --- | --- |
| Free | 5 |
| Team | 50 |
| Enterprise | 200 |

Jobs above the concurrency limit are queued, not dropped. They will begin executing as soon as a slot becomes available. In practice, queue time at typical usage is under 30 seconds on Free and negligible on Team and above.

For self-hosted deployments, there is no platform-enforced concurrency limit — it is bounded by your own infrastructure.

---

## Execution History Retention

Each `nolapse run` produces an execution record accessible via `GET /v1/executions`. Records are retained for:

| Plan | Retention period |
| --- | --- |
| Free | 30 days |
| Team | 90 days |
| Enterprise | 1 year (longer by contract) |

Records older than the retention window are deleted permanently. This affects the dashboard coverage history chart and the `GET /v1/executions` API. It does not affect the baseline file — `baseline.md` is stored in your git repository and is not subject to retention limits.

---

## Checking Current Usage

:::note[Usage dashboard — planned]
A usage page in the nolapse dashboard is planned. Until it is live, use the API to check usage.
:::

You can check current token usage via:

```bash
curl -s \
  -H "Authorization: Bearer nlp_<your-token>" \
  https://api.nolapse.dev/v1/tokens | jq '.tokens | length'
```

Repository count will be available via a planned `GET /v1/repos` endpoint. For now, count the distinct `repo` values in your `GET /v1/executions` responses.

---

## Upgrading to Remove Limits

If you are approaching a limit, upgrading your plan takes effect immediately. See [Plans & Pricing](/billing/plans/) for pricing details and how to upgrade.

---

## See Also

- [Plans & Pricing](/billing/plans/) — full plan comparison and pricing
- [Token Setup](/tokens/setup/) — creating and managing tokens
- [API Overview](/api/overview/) — base URL and authentication
