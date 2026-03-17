---
title: Add a Coverage Badge
description: Embed the nolapse SVG badge in your README to show live coverage status at a glance.
---

The nolapse badge endpoint returns an SVG image showing your repository's current coverage status. Embed it in your README so contributors and users can see coverage health at a glance.

:::note[Implementation status]
The badge endpoint (`GET /v1/badge/{org}/{repo}`) is **planned** — story [#44](https://github.com/nolapse-dev/nolapse-platform/issues/44). It currently returns an "unknown" badge for all repos. The badge will start showing real data once the endpoint is live and your repo has at least one execution record.
:::

---

## Badge URL

```text
https://api.nolapse.dev/v1/badge/{org}/{repo}
```

Replace `{org}` with your organisation slug and `{repo}` with your repository name.

Example:

```text
https://api.nolapse.dev/v1/badge/acme/api-service
```

---

## Embed in README

### Markdown

```markdown
![coverage](https://api.nolapse.dev/v1/badge/my-org/my-repo)
```

### Markdown with link to nolapse dashboard

```markdown
[![coverage](https://api.nolapse.dev/v1/badge/my-org/my-repo)](https://app.nolapse.dev/my-org/my-repo)
```

### HTML

```html
<img src="https://api.nolapse.dev/v1/badge/my-org/my-repo" alt="coverage" />
```

---

## Badge States

The badge colour depends on the most recent execution's coverage percentage:

| Coverage | Badge colour | Label example |
| --- | --- | --- |
| 80% or above | Green | `coverage 84%` |
| 60% to 79% | Yellow | `coverage 72%` |
| Below 60% | Red | `coverage 45%` |
| No baseline or no executions | Grey | `coverage unknown` |

The thresholds (80% / 60%) are fixed for the badge display. They are separate from your `warn_threshold` and `fail_threshold` enforcement settings.

---

## Caching

The badge endpoint sets `Cache-Control: public, max-age=60`. This means:

- CDNs and browsers may cache the badge for up to 60 seconds.
- After a new execution record is written, the badge may take up to 60 seconds to update.
- GitHub's README image proxy also caches badge images. You may see a delay of a few minutes before a newly updated badge reflects the latest execution.

To force an immediate refresh in a browser, append a cache-bust query string: `?v=2`. This does not affect the actual badge data — it only bypasses the local browser cache.

---

## Self-Hosted Deployments

For self-hosted deployments, replace `https://api.nolapse.dev` with your server's base URL:

```markdown
![coverage](http://nolapse.internal.example.com/v1/badge/my-org/my-repo)
```

Note that GitHub's README renderer will not load badge images from `http://` URLs in public repositories. Use HTTPS for your self-hosted instance if you want the badge to render on GitHub.

---

## See Also

- [API Overview](/api/overview/) — full endpoint index and base URL
- [Plans & Pricing](/billing/plans/) — badge endpoint is available on all plans
