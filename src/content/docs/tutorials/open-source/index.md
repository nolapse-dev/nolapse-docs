---
title: "Tutorial: Open Source Project"
description: Add nolapse to a public open-source repo — badge in README, strict mode for contributors, and a CONTRIBUTING guide snippet.
---

This tutorial covers the specific considerations for adding nolapse to a public open-source project: displaying the badge in the README, communicating the coverage gate to contributors, and choosing the right threshold for a project with external contributors.

The core nolapse commands (`init`, `run`) work the same as in any other project. This tutorial focuses on what is different for open-source.

---

## Why Coverage Gates Matter for Open Source

Open-source projects accept contributions from developers unfamiliar with the codebase. A coverage gate makes it explicit, before code review begins, whether new code is tested. This reduces review burden and prevents gradual coverage erosion as the contributor count grows.

---

## Step 1 — Initialise nolapse

For a Go project:

```bash
nolapse init --repo .
git add .audit/coverage/baseline.md nolapse.yaml
git commit -m "chore: add nolapse coverage baseline"
```

For a Python project:

```bash
nolapse init --repo . --lang python
git add .audit/coverage/baseline.md nolapse.yaml
git commit -m "chore: add nolapse coverage baseline"
```

---

## Step 2 — Choose a Threshold for Open Source

External contributors may not know the codebase well enough to achieve zero regression. A slightly looser threshold avoids discouraging first-time contributors while still catching significant regressions:

```yaml
# nolapse.yaml — recommended open-source starting point
lang: go
warn_threshold: 0.5
fail_threshold: 2.0
```

This allows minor drops (under 0.5 pp) without any warning, and fails only if coverage drops more than 2 percentage points. Tighten this over time as the contributor community grows familiar with the expectations.

For projects with strict test discipline, use:

```yaml
warn_threshold: 0.0
fail_threshold: 0.5
strict_mode: false
```

---

## Step 3 — Add the GitHub Actions workflow

```yaml
name: Coverage check

on:
  pull_request:

jobs:
  coverage:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Run nolapse
        uses: nolapse/nolapse-action@v1
        with:
          repo-token: ${{ secrets.GITHUB_TOKEN }}
          warn-threshold: "0.5"
          fail-threshold: "2.0"
```

The `GITHUB_TOKEN` is automatically available in public repositories — no secrets configuration is needed. nolapse will post a coverage summary comment on every PR.

---

## Step 4 — Add the Coverage Badge

Add the badge to the top of your `README.md`, next to your existing CI and license badges:

```markdown
[![coverage](https://api.nolapse.dev/v1/badge/my-org/my-repo)](https://app.nolapse.dev/my-org/my-repo)
```

See [Add a Coverage Badge](/how-to/badge/) for badge states and caching details.

:::note[Badge status]
The badge endpoint is planned (story #44). Until it is live, the badge shows "unknown" for all repos.
:::

---

## Step 5 — Update CONTRIBUTING.md

Add a section to your `CONTRIBUTING.md` so contributors understand the coverage expectation before opening a PR:

```markdown
## Coverage

This project uses [nolapse](https://nolapse.dev) to enforce coverage on every pull request.

- Run `nolapse run --repo .` locally before pushing to check your coverage delta.
- The CI check fails if coverage drops more than 2 percentage points from the baseline.
- If you are adding a new feature, add tests for it. If you are fixing a bug,
  add a regression test.
- If your change intentionally reduces coverage (e.g. removing dead code),
  explain this in the PR description and a maintainer will update the baseline.
```

---

## Step 6 — Enable Branch Protection

Go to **Settings → Branches** on your GitHub repository. Require the **Coverage check / coverage** status check to pass before merging. This enforces the gate even for maintainers.

---

## Handling Coverage Drops from Contributors

When a PR legitimately drops coverage (e.g. a contributor removes dead code), a maintainer can update the baseline after merging:

```bash
git checkout main && git pull
nolapse run --repo .
nolapse baseline update --repo .
git add .audit/coverage/baseline.md
git commit -m "chore: update nolapse baseline after dead code removal"
git push
```

---

## See Also

- [Add a Coverage Badge](/how-to/badge/) — badge URL, states, and embed syntax
- [Block PRs on Coverage Regression](/how-to/pr-gate/) — full branch protection setup
- [Raise Your Coverage Threshold](/how-to/raise-threshold/) — tightening thresholds over time
- [Baseline Update](/baseline/update/) — how and when to update the baseline
