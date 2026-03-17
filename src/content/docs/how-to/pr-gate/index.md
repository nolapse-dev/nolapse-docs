---
title: Block PRs on Coverage Regression
description: Add nolapse to GitHub Actions and enable branch protection to prevent merging PRs that drop coverage below your threshold.
---

This guide walks through the complete setup to block pull requests that regress coverage. By the end, the nolapse check will be required to pass before any PR can merge into your default branch.

---

## Prerequisites

- nolapse initialised in your repo (`nolapse init` has been run and `baseline.md` is committed)
- A GitHub repository with branch protection available (any plan)

---

## Step 1 — Add the GitHub Actions workflow

Create `.github/workflows/coverage.yml`:

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

Key points:

- `fetch-depth: 0` is required so nolapse can read the full git history and the committed baseline.
- `repo-token` allows the action to post a coverage summary as a PR comment and set the commit status.
- `warn-threshold` and `fail-threshold` are in percentage points. `1.0` means a 1 percentage-point drop triggers a failure.

For a Python project, add `lang: python` to the `with` block:

```yaml
      - name: Run nolapse
        uses: nolapse/nolapse-action@v1
        with:
          repo-token: ${{ secrets.GITHUB_TOKEN }}
          lang: python
          warn-threshold: "0.5"
          fail-threshold: "1.0"
```

---

## Step 2 — Commit and push

```bash
git add .github/workflows/coverage.yml
git commit -m "ci: add nolapse coverage gate"
git push
```

Open a pull request. GitHub will pick up the new workflow and run it. The check appears as **Coverage check / coverage** in the PR checks list.

---

## Step 3 — Enable branch protection

Go to your repository on GitHub: **Settings → Branches → Add rule** (or edit the existing rule for your default branch).

1. Set **Branch name pattern** to `main` (or your default branch name).
2. Enable **Require status checks to pass before merging**.
3. In the search box, type `coverage` and select **Coverage check / coverage**.
4. Enable **Require branches to be up to date before merging** (recommended — prevents stale-branch bypasses).
5. Save the rule.

From this point on, any PR that fails the nolapse check cannot be merged until either the coverage regression is fixed or the threshold is adjusted.

---

## How the Check Appears on a PR

When nolapse runs, it posts a comment to the PR and sets a GitHub commit status. An example comment:

```text
## nolapse coverage report

| File | Baseline | PR coverage | Delta | Outcome |
| --- | --- | --- | --- | --- |
| .   | 82.50%   | 81.20%      | -1.30% | fail   |

outcome: fail  delta: -1.30%  fail_threshold: 1.0%
```

The commit status shows as a red X with the label "Coverage check / coverage" when the outcome is `fail`, blocking the merge button.

---

## Adjusting Thresholds

To change the thresholds, edit the `warn-threshold` and `fail-threshold` values in `coverage.yml`, or set them permanently in `nolapse.yaml` and remove the flags from the workflow:

```yaml
# nolapse.yaml
lang: go
warn_threshold: 0.5
fail_threshold: 1.0
```

See [Raise Your Coverage Threshold](/how-to/raise-threshold/) for a guide on incrementally tightening enforcement.

---

## See Also

- [Raise Your Coverage Threshold](/how-to/raise-threshold/) — incrementally increase the coverage floor
- [Your First Enforcement](/first-enforcement/) — how pass, warn, and fail outcomes are determined
- [Exit Codes](/reference/exit-codes/) — all nolapse exit codes
