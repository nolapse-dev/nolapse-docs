---
title: Plans & Pricing
description: Free, Team, and Enterprise plan details — repo limits, token limits, support tiers, and how to upgrade.
---

nolapse is available in three tiers. All plans include the core CLI, git-native baselines, and GitHub Actions integration. Limits and support levels differ.

---

## Plan Comparison

| | Free | Team | Enterprise |
| --- | --- | --- | --- |
| **Price** | $0 | $500 / month | From $24,000 / year |
| **Repositories** | Up to 10 | Up to 100 | Unlimited |
| **Tokens per org** | 1 | 10 | Unlimited |
| **Concurrent runner jobs** | 5 | 50 | 200 |
| **Execution history** | 30 days | 90 days | 1 year |
| **Support** | Community (GitHub Discussions) | Email + chat | Dedicated customer success |
| **SLA** | None | None | 99.9% uptime, 4-hour response |
| **SSO / SAML** | — | — | Included |
| **Audit log** | — | — | Included |
| **Custom thresholds per repo** | Yes | Yes | Yes |
| **Badge endpoint** | Yes | Yes | Yes |

---

## Free

The Free plan is designed for individuals and small teams exploring nolapse, or for open-source projects that want a public coverage badge.

- **$0** — no credit card required
- Up to **10 repositories** tracked
- **1 API token** per organisation
- Community support via [GitHub Discussions](https://github.com/nolapse-dev/nolapse-platform/discussions)

The Free plan has no time limit. There is no trial period — it remains free indefinitely.

---

## Team

The Team plan is designed for engineering teams that need multiple tokens for service accounts, CI bots, and developer workstations.

- **$500 per month**, billed monthly or annually (annual billing available at a discount — contact sales)
- Up to **100 repositories** tracked
- **10 API tokens** per organisation
- Email and chat support with a 1-business-day response time

---

## Enterprise

The Enterprise plan is designed for organisations that need compliance guarantees, SSO, and dedicated support.

- **From $24,000 per year**, billed annually
- **Unlimited** repositories and tokens
- **200 concurrent** runner jobs on cloud
- **Dedicated customer success** manager
- **99.9% uptime SLA** with 4-hour initial response for P1 incidents
- SSO / SAML integration
- Full audit log for token creation, rotation, and deletion
- Custom execution history retention beyond 1 year (negotiated per contract)
- Custom contract and MSA available

To discuss Enterprise pricing, reach out to [sales@nolapse.dev](mailto:sales@nolapse.dev) or use the contact form on the nolapse website.

---

## How to Upgrade

:::note[Upgrade flow — planned]
The self-service upgrade UI is planned. Until it is live, upgrades are handled manually. Email [support@nolapse.dev](mailto:support@nolapse.dev) with your organisation slug to request a plan change.
:::

Once the upgrade UI is available:

1. Sign in to the nolapse dashboard.
2. Navigate to **Settings → Billing**.
3. Select the plan you want and confirm payment details.
4. Your new limits take effect immediately.

Downgrading from Team or Enterprise to a lower tier is possible at the end of your current billing period. Repositories above the new limit will stop receiving new execution records but will not lose existing history.

---

## What Happens When You Hit a Limit

| Limit type | Behaviour when exceeded |
| --- | --- |
| Repository limit | New `nolapse init` calls for a new repo are rejected with an error. Existing repos continue to work. |
| Token limit | `POST /v1/tokens` returns `402 Payment Required` with a message indicating the plan token cap. |
| Concurrent jobs | Execution submissions are queued; they do not fail. Jobs begin as soon as a slot is available. |

---

## See Also

- [Usage & Limits](/billing/usage/) — detailed breakdown of quotas and how to check current usage
- [Token Setup](/tokens/setup/) — creating and managing API tokens
