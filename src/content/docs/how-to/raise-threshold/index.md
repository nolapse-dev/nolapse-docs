---
title: Raise Your Coverage Threshold
description: When and why to tighten coverage thresholds, and how to do it incrementally without breaking CI.
---

Once nolapse is protecting your repo, you may want to tighten the thresholds over time — preventing regressions of any size, or enforcing a minimum absolute coverage percentage. This guide explains both approaches.

---

## Understanding the Two Thresholds

nolapse uses two thresholds, both expressed as **maximum allowed percentage-point drops** from the baseline:

- `warn_threshold` — drops larger than this produce a `warn` outcome (exit 0 by default)
- `fail_threshold` — drops larger than this produce a `fail` outcome (exit 1, blocks CI)

The defaults are `warn_threshold: 0.5` and `fail_threshold: 1.0`. Setting both to `0` means any regression, no matter how small, will fail.

---

## When to Raise Thresholds

- **After a coverage improvement sprint:** Once your team has pushed coverage from 60% to 80%, you want to lock in that gain. Lower both thresholds to prevent backsliding.
- **Before a release:** Temporarily tighten thresholds on a release branch to ensure the release is as well-tested as possible.
- **Gradual hardening:** Teams new to coverage enforcement often start with loose thresholds (`warn: 2.0, fail: 5.0`) and tighten each quarter.

---

## Method 1 — Edit `nolapse.yaml` (Persistent)

This is the recommended approach for permanent threshold changes.

Before:

```yaml
lang: go
warn_threshold: 0.5
fail_threshold: 1.0
```

After (tighter — any drop of more than 0.1% is a fail):

```yaml
lang: go
warn_threshold: 0.0
fail_threshold: 0.1
```

After editing, commit the change:

```bash
git add nolapse.yaml
git commit -m "chore: tighten nolapse fail threshold to 0.1%"
```

The new thresholds apply to all subsequent `nolapse run` invocations, including in CI.

### Strict Mode — Zero Tolerance

To fail on any regression at all, set `fail_threshold: 0` and optionally enable strict mode:

```yaml
lang: go
warn_threshold: 0.0
fail_threshold: 0.0
strict_mode: true
```

With `strict_mode: true`, even `warn` outcomes exit with code 1. This is the maximum enforcement level.

---

## Method 2 — Use Flags (Per-Run Override)

Flags override `nolapse.yaml` for a single invocation. This is useful for checking a release branch without permanently changing the config, or for one-off experiments:

```bash
# Check with zero tolerance — nothing can drop
nolapse run --repo . --warn-threshold 0 --fail-threshold 0

# Check with looser thresholds for a large refactor branch
nolapse run --repo . --warn-threshold 3.0 --fail-threshold 10.0
```

In a GitHub Actions workflow, you can pass thresholds as action inputs:

```yaml
- name: Run nolapse (release gate)
  uses: nolapse/nolapse-action@v1
  with:
    repo-token: ${{ secrets.GITHUB_TOKEN }}
    warn-threshold: "0.0"
    fail-threshold: "0.1"
```

---

## Gradual Enforcement Strategy

If your team is not yet confident about the codebase's coverage stability, raise thresholds incrementally:

| Quarter | `warn_threshold` | `fail_threshold` | Effect |
| --- | --- | --- | --- |
| Q1 (start) | 2.0 | 5.0 | Only catastrophic regressions fail |
| Q2 | 1.0 | 2.0 | Moderate regressions fail |
| Q3 | 0.5 | 1.0 | Small regressions fail (recommended steady state) |
| Q4 | 0.0 | 0.1 | Nearly zero tolerance |

Announce each threshold change to the team before merging to avoid surprise CI failures.

---

## Updating the Baseline After a Threshold Change

Changing thresholds does not change the baseline. If you simultaneously improved coverage and want to lock in the new higher number as the baseline:

```bash
nolapse run --repo .
nolapse baseline update --repo .
git add .audit/coverage/baseline.md
git commit -m "chore: update nolapse baseline to 85.20%"
```

---

## See Also

- [Block PRs on Coverage Regression](/how-to/pr-gate/) — full PR gate setup
- [nolapse.yaml Reference](/config/nolapse-yaml/) — all configuration fields
- [Your First Enforcement](/first-enforcement/) — pass, warn, and fail logic explained
