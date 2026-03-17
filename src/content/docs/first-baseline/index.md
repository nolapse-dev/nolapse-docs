---
title: Your First Baseline
description: Run nolapse init, understand what baseline.md contains, and learn why the baseline lives in git.
---

A baseline is nolapse's reference point. Every time `nolapse run` executes, it compares the current coverage against the most recent baseline and reports the delta. This page explains `nolapse init` in detail — what it does, what it creates, and how to work with it over time.

---

## Running nolapse init

### Go project

```bash
nolapse init --repo /path/to/your/repo
```

### Python project

```bash
nolapse init --repo /path/to/your/repo --lang python
```

If `--repo` is omitted, nolapse defaults to the current working directory.

### What happens during init

1. nolapse detects (or reads from `--lang`) whether this is a Go or Python project.
2. It runs the appropriate test suite with coverage instrumentation.
3. It reads the total coverage percentage from the tool output.
4. It records the current git commit SHA via `git rev-parse HEAD`.
5. It writes `.audit/coverage/baseline.md` with those values.
6. It writes `nolapse.yaml` at the repo root with sensible defaults.

---

## The files init creates

### .audit/coverage/baseline.md

```text
coverage: 82.50%
timestamp: 2026-01-15T09:00:00Z
commit: a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2
```

| Field | Description |
| --- | --- |
| `coverage` | Total coverage percentage at the time of init, rounded to two decimal places. |
| `timestamp` | UTC ISO-8601 timestamp of when init ran. |
| `commit` | 40-character git SHA of the current HEAD at init time. |

The file is append-only. Each call to `nolapse baseline update` appends a new line in pipe-delimited format:

```text
coverage: 82.50%
timestamp: 2026-01-15T09:00:00Z
commit: a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2

2026-02-01T14:22:00Z | 83.10% | b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3
2026-02-15T11:05:00Z | 84.00% | c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4
```

`nolapse run` always reads the **header block** (the first three fields) as the authoritative baseline. The appended lines are an audit trail consumed by `nolapse audit list`.

### nolapse.yaml

```yaml
lang: go              # go | python
warn_threshold: -1.0  # warn when delta drops below this (percentage points)
fail_threshold: -5.0  # fail when delta drops below this (percentage points)
strict_mode: false    # if true, warn outcome exits 1 instead of 0
```

Edit `nolapse.yaml` to tighten or relax thresholds for your project. Values here are overridden by flags passed directly to `nolapse run`. See [CLI Reference](/reference/cli/) for the full flag list.

---

## Why the baseline lives in git

Storing `baseline.md` in version control means:

- **Every branch carries its own history.** When two feature branches diverge from `main`, each has a valid baseline to measure against. No external state store is needed.
- **Reviews are auditable.** A pull request that updates the baseline is visible in the diff. Reviewers can see that coverage moved and why.
- **Rollbacks are safe.** If a merge introduces a regression and you revert, the baseline reverts with it.
- **CI is stateless.** The GitHub Action does not need database credentials or a remote API call to fetch the baseline — it reads the file from the checkout.

Commit both generated files immediately after `init`:

```bash
git add .audit/coverage/baseline.md nolapse.yaml
git commit -m "chore: add nolapse coverage baseline"
```

---

## The --force flag

By default, `nolapse init` refuses to overwrite an existing `baseline.md`. This protects against accidentally resetting a carefully maintained baseline. Use `--force` to overwrite:

```bash
nolapse init --repo . --force
```

Use cases for `--force`:

- You have significantly refactored the project and the old baseline no longer reflects a meaningful reference point.
- You need to reset after a large test suite rewrite.
- You are re-running init in a CI seed job that expects to always produce a fresh baseline.

`--force` overwrites the header block of `baseline.md` and regenerates `nolapse.yaml`. Appended audit lines are cleared.

---

## Updating the baseline over time

After merging a pull request that legitimately raises (or resets) coverage, update the baseline so future PRs are measured against the new level:

```bash
nolapse baseline update --repo .
```

This appends a new timestamped entry to `baseline.md`, promotes it to the active header, and creates a git commit. See [CLI Reference — baseline update](/reference/cli/#baseline-update) for details.

---

## Next step

With a baseline committed, open a pull request and run [Your First Enforcement](/first-enforcement/) to see pass, warn, and fail in action.
