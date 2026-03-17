---
title: Migrate from Codecov
description: Step-by-step guide to replacing Codecov with nolapse — no external service dependency, baseline lives in git.
---

This guide walks through migrating from Codecov (or Coveralls) to nolapse. The migration takes less than an afternoon for most repositories. The key difference: nolapse stores the baseline in your git repository as `baseline.md` — there is no external service required to run the coverage gate.

---

## Key Differences

| | Codecov | nolapse |
| --- | --- | --- |
| Baseline storage | Codecov servers | `.audit/coverage/baseline.md` in your git repo |
| External service dependency | Required | Optional (cloud for badge + history; not required for gate) |
| Gate mechanism | Codecov GitHub App check | `nolapse run` exit code in GitHub Actions |
| Coverage report format | Uploaded on each run | Measured locally by the CLI |
| Works offline / air-gapped | No | Yes |

---

## Step 1 — Remove the Codecov action

In your existing GitHub Actions workflow, find and delete the Codecov upload step. It typically looks like one of these:

```yaml
# Remove this:
- name: Upload coverage to Codecov
  uses: codecov/codecov-action@v4
  with:
    token: ${{ secrets.CODECOV_TOKEN }}
```

```yaml
# Or this variant:
- uses: codecov/codecov-action@v4
```

Also remove `CODECOV_TOKEN` from your repository secrets (**Settings → Secrets and variables → Actions**) once migration is complete.

---

## Step 2 — Install nolapse and create a baseline

If you have not already done so, install the nolapse CLI:

```bash
go install github.com/nolapse/nolapse-cli/nolapse-cli/cmd/nolapse@latest
```

From your repository root, create the baseline:

```bash
# Go project
nolapse init --repo .

# Python project
nolapse init --repo . --lang python
```

This creates `.audit/coverage/baseline.md` and `nolapse.yaml`. Commit both files:

```bash
git add .audit/coverage/baseline.md nolapse.yaml
git commit -m "chore: add nolapse coverage baseline (migrating from Codecov)"
```

---

## Step 3 — Add the nolapse GitHub Action

Replace the Codecov step with the nolapse action. A minimal workflow:

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
          fail-threshold: "1.0"
```

No additional token is required beyond the standard `GITHUB_TOKEN` that is automatically available in all GitHub Actions workflows.

---

## Step 4 — Update the README badge

Replace the Codecov badge with the nolapse badge.

Before:

```markdown
[![codecov](https://codecov.io/gh/my-org/my-repo/graph/badge.svg)](https://codecov.io/gh/my-org/my-repo)
```

After:

```markdown
[![coverage](https://api.nolapse.dev/v1/badge/my-org/my-repo)](https://app.nolapse.dev/my-org/my-repo)
```

See [Add a Coverage Badge](/how-to/badge/) for badge states and caching details.

---

## Step 5 — Enable branch protection (optional but recommended)

If you had Codecov configured as a required status check, update the branch protection rule to require the **Coverage check / coverage** check from nolapse instead. See [Block PRs on Coverage Regression](/how-to/pr-gate/) for the full setup.

---

## Frequently Asked Questions

### Do I lose historical coverage data?

Codecov's historical data stays on Codecov's servers. nolapse starts fresh from the baseline you create during migration. There is no import path for Codecov historical data.

### Can I run both during a transition period?

Yes. The two actions are independent. Run both in the same workflow for a few sprints to compare results before removing Codecov entirely.

### What if my current coverage is lower than the Codecov target?

The nolapse baseline records your current coverage, whatever it is. The gate enforces that coverage does not drop further from that point. You can separately tighten thresholds over time — see [Raise Your Coverage Threshold](/how-to/raise-threshold/).

---

## See Also

- [Add a Coverage Badge](/how-to/badge/) — badge URL and embed syntax
- [Block PRs on Coverage Regression](/how-to/pr-gate/) — full PR gate setup
- [Raise Your Coverage Threshold](/how-to/raise-threshold/) — incremental enforcement strategy
