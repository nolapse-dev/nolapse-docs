---
title: Quickstart
description: Go from zero to your first nolapse run in under 30 minutes.
---

This guide walks through the four steps needed to get nolapse protecting your repository's coverage. By the end you will have a baseline committed to git and a GitHub Action that enforces coverage on every pull request.

**Time to complete:** under 30 minutes.

---

## Step 1 — Install nolapse

```bash
go install github.com/nolapse/nolapse-cli/nolapse-cli/cmd/nolapse@latest
```

Confirm the binary is on your `PATH`:

```bash
nolapse version
# nolapse v0.1.0
```

For full prerequisite details (Go version, Python setup) see [Install nolapse](/install/).

---

## Step 2 — Create your baseline

From the root of your repository, run:

```bash
# Go project
nolapse init --repo .

# Python project
nolapse init --repo . --lang python
```

nolapse measures your current coverage, writes the result to `.audit/coverage/baseline.md`, and creates a `nolapse.yaml` config file.

```text
.
├── .audit/
│   └── coverage/
│       └── baseline.md   ← created by init
└── nolapse.yaml          ← created by init
```

The baseline file records the coverage percentage, a UTC timestamp, and the current git commit SHA:

```text
coverage: 82.50%
timestamp: 2026-01-15T09:00:00Z
commit: a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2
```

Commit both files so they travel with your code:

```bash
git add .audit/coverage/baseline.md nolapse.yaml
git commit -m "chore: add nolapse coverage baseline"
```

---

## Step 3 — Run your first coverage check

```bash
nolapse run --repo .
```

Example output when coverage has improved since the baseline:

```text
file  baseline coverage  PR coverage  delta    outcome
.     82.50%             84.10%       +1.60%   pass

outcome: pass  delta: +1.60  coverage: 84.10%  baseline: 82.50%  outcome: pass
warn_threshold: 0.5  fail_threshold: 1.0
Coverage delta: +1.60% (threshold: 0.5%)  pass
```

The exit code is `0` for pass or warn outcomes, `1` for a fail (regression exceeds the fail threshold). CI systems use this exit code to block or allow merges.

See [Your First Enforcement](/first-enforcement/) for a deep dive on pass/warn/fail logic and flag overrides.

---

## Step 4 — Add the GitHub Action

Create `.github/workflows/coverage.yml` in your repository:

```yaml
name: Coverage check

on:
  pull_request:

jobs:
  coverage:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Run nolapse
        uses: nolapse/nolapse-action@v1
        with:
          repo-token: ${{ secrets.GITHUB_TOKEN }}
          warn-threshold: "0.5"
          fail-threshold: "1.0"
```

Push this file on a branch and open a pull request. nolapse will run as a check, post a coverage table as a PR comment, and fail the check if the regression exceeds your `fail-threshold`.

---

## What's next

- [Your First Baseline](/first-baseline/) — understand every field in `baseline.md` and when to update it.
- [Your First Enforcement](/first-enforcement/) — learn how pass, warn, and fail outcomes are determined.
- [CLI Reference](/reference/cli/) — all flags, defaults, and exit codes.
