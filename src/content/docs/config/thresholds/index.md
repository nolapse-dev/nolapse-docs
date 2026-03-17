---
title: "Thresholds"
description: How warn_threshold, fail_threshold, and strict_mode work — with a decision table and worked examples.
---

Thresholds control how nolapse responds when the current coverage differs from the baseline. There are two threshold levels (warn and fail) and a strict mode flag that controls exit codes.

## Concepts

nolapse computes a **delta** — the difference between current coverage and the baseline:

```text
delta = current_coverage - baseline_coverage
```

A negative delta means coverage has dropped. A positive delta means it has improved. Thresholds define how large a drop is tolerable before nolapse warns or fails.

## Decision table

Given a delta, nolapse applies the following logic (using the default thresholds of `warn=0.5`, `fail=1.0` as absolute values):

| Condition                          | Outcome | Exit code (normal) | Exit code (strict) |
| ---------------------------------- | ------- | ------------------ | ------------------ |
| delta > −warn_threshold            | Pass    | 0                  | 0                  |
| delta > −fail_threshold            | Warn    | 0                  | 1                  |
| delta ≤ −fail_threshold            | Fail    | 1                  | 1                  |

With defaults (`warn_threshold: -0.5`, `fail_threshold: -1.0`):

- delta > −0.5 (i.e., dropped less than 0.5 pp, or improved) → **Pass**
- delta > −1.0 (i.e., dropped between 0.5 and 1.0 pp) → **Warn**
- delta ≤ −1.0 (i.e., dropped 1.0 pp or more) → **Fail**

## Worked examples

Assume baseline coverage is **82.00%**.

### Example 1 — Coverage drops 0.3 pp → Pass

Current coverage: **81.70%**

```text
delta = 81.70 - 82.00 = -0.30
-0.30 > -0.50 (warn threshold) → Pass (exit 0)
```

### Example 2 — Coverage drops 0.8 pp → Warn

Current coverage: **81.20%**

```text
delta = 81.20 - 82.00 = -0.80
-0.80 ≤ -0.50 (warn threshold) → not a pass
-0.80 > -1.00 (fail threshold) → Warn (exit 0, or exit 1 in strict mode)
```

### Example 3 — Coverage drops 1.5 pp → Fail

Current coverage: **80.50%**

```text
delta = 80.50 - 82.00 = -1.50
-1.50 ≤ -1.00 (fail threshold) → Fail (exit 1)
```

### Example 4 — Coverage improves → Pass

Current coverage: **83.10%**

```text
delta = 83.10 - 82.00 = +1.10
+1.10 > -0.50 (warn threshold) → Pass (exit 0)
```

## Why 0.5 / 1.0 are the defaults

The built-in defaults (warn at 0.5 pp, fail at 1.0 pp) are intentionally permissive starting points:

- **0.5 pp** is small enough to catch meaningful regressions on most codebases without generating noise from minor refactors.
- **1.0 pp** is the point at which a regression is likely large enough to warrant a pipeline block.

These defaults suit teams getting started. Production services may want tighter limits (e.g., `warn: -0.1`, `fail: -0.5`), while teams adopting nolapse on a legacy codebase with low existing coverage may prefer looser limits (e.g., `warn: -3.0`, `fail: -10.0`).

## strict_mode

By default, a **warn** result exits 0. CI passes, but the warning is printed to stdout. This is useful when you want visibility without blocking every PR.

Setting `strict_mode: true` (or passing `--strict-mode`) causes a **warn** to also exit 1, blocking CI the same way a fail does.

```yaml
# nolapse.yaml
strict_mode: true
```

Use strict mode when:
- You are past the adoption phase and want zero tolerance for any measurable regression.
- You want all threshold violations — warn or fail — to be treated equally in your pipeline.

## Setting thresholds per-repo vs per-run

### Per-repo (recommended for most teams)

Add thresholds to `nolapse.yaml` in the repository root. These apply to every `nolapse run` in that repo.

```yaml
# nolapse.yaml
warn_threshold: -1.0
fail_threshold: -3.0
strict_mode: false
```

### Per-run (CLI flags)

Pass `--warn-threshold` and `--fail-threshold` directly to `nolapse run`. These override `nolapse.yaml` for that invocation only.

:::note[CLI flags use positive values]
CLI flags accept positive numbers. `--warn-threshold 1.0` is equivalent to `warn_threshold: -1.0` in yaml.
:::

```bash
# Tighten enforcement temporarily for a release branch check
nolapse run --warn-threshold 0.1 --fail-threshold 0.5 --strict-mode
```

This is useful for:
- One-off stricter checks on release or hotfix branches.
- Prototyping threshold changes before committing them to `nolapse.yaml`.
- CI matrix jobs where different branches have different tolerance levels.
