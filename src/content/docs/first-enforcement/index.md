---
title: Your First Enforcement
description: Run nolapse run on a pull request and understand pass, warn, and fail outcomes, exit codes, and flag overrides.
---

`nolapse run` is the enforcement command. It measures coverage in the current working tree, compares it against the baseline, classifies the result as pass, warn, or fail, and exits with a code that CI can act on.

---

## Running the check

```bash
nolapse run --repo .
```

For a Python project, add `--lang python` if it is not already set in `nolapse.yaml`:

```bash
nolapse run --repo . --lang python
```

---

## How the check works

At a conceptual level, `nolapse run` performs these steps:

1. Reads `nolapse.yaml` from the repo root for `lang`, `warn_threshold`, `fail_threshold`, and `strict_mode`.
2. Applies any flags passed on the command line, which override `nolapse.yaml` values.
3. Locates `.audit/coverage/baseline.md` and reads the `coverage:` field from the header block.
4. Runs the test suite with coverage instrumentation (Go: `go test -cover ./...`; Python: `pytest --cov` via the runner subprocess).
5. Parses the total coverage percentage from the tool output.
6. Calculates `delta = current_coverage - baseline_coverage`.
7. Classifies the outcome using the threshold logic (see below).
8. Prints the results table and summary line to stdout.
9. Exits with code `0` (pass or warn) or `1` (fail), modified by `--strict-mode`.

---

## Understanding the output

```text
file  baseline coverage  PR coverage  delta    outcome
.     80.00%             82.30%       +2.30%   pass

outcome: pass  delta: +2.30  coverage: 82.30%  baseline: 80.00%  outcome: pass
warn_threshold: 0.5  fail_threshold: 1.0
Coverage delta: +2.30% (threshold: 0.5%)  pass
```

| Column / Field | Meaning |
| --- | --- |
| `file` | Repository path checked (`.` means root). |
| `baseline coverage` | Coverage recorded in `.audit/coverage/baseline.md`. |
| `PR coverage` | Coverage measured in the current working tree. |
| `delta` | Difference in percentage points (`current − baseline`). Positive means improved. |
| `outcome` | `pass`, `warn`, or `fail` (see logic below). |
| `warn_threshold` | Active warn threshold (from config or flag). |
| `fail_threshold` | Active fail threshold (from config or flag). |

---

## Pass, warn, and fail

nolapse uses two thresholds expressed as **negative percentage-point drops**. The defaults are `warn_threshold = 0.5` and `fail_threshold = 1.0`.

| Condition | Outcome | Exit code |
| --- | --- | --- |
| `delta > -warn_threshold` | **pass** | `0` |
| `delta > -fail_threshold` (and not pass) | **warn** | `0` (or `1` with strict mode) |
| `delta ≤ -fail_threshold` | **fail** | `1` |

### Examples with default thresholds (warn=0.5, fail=1.0)

| Delta | Outcome | Why |
| --- | --- | --- |
| `+2.30%` | pass | Improved; above warn threshold |
| `0.00%` | pass | No change; above warn threshold |
| `-0.30%` | pass | Small drop, still above -0.5 |
| `-0.70%` | warn | Below -0.5 but above -1.0 |
| `-1.00%` | fail | At the fail threshold |
| `-3.50%` | fail | Well below fail threshold |

---

## Strict mode

When `strict_mode: true` is set in `nolapse.yaml` (or `--strict-mode` is passed on the command line), a **warn** outcome exits with code `1` instead of `0`. This is useful when you want zero tolerance for any regression, even small ones, without tightening the thresholds permanently.

```bash
nolapse run --repo . --strict-mode
```

---

## Overriding thresholds at runtime

All threshold values can be overridden per invocation without editing `nolapse.yaml`:

```bash
# Tighter thresholds for a release branch
nolapse run --repo . --warn-threshold 0.1 --fail-threshold 0.5

# Looser thresholds for an experimental branch
nolapse run --repo . --warn-threshold 2.0 --fail-threshold 5.0
```

Command-line flags always take precedence over `nolapse.yaml`.

---

## How CI uses exit codes

The exit code is the mechanism by which CI systems enforce the gate:

- **Exit `0`** — the check step succeeds. The pipeline continues. A warn outcome still exits `0` unless `--strict-mode` is active.
- **Exit `1`** — the check step fails. Most CI systems (GitHub Actions, GitLab CI, CircleCI) mark the job as failed and, if the branch protection requires the check to pass, block the merge.
- **Non-zero (other)** — a configuration or runtime error occurred (missing baseline, git not available, test runner crash). The step also fails.

In a GitHub Actions workflow the step looks like:

```yaml
- name: Enforce coverage
  run: nolapse run --repo .
  # No 'continue-on-error' — let the non-zero exit block the PR
```

For a softer gate that reports but never blocks, use `continue-on-error: true` and rely on the PR comment for visibility.

---

## Next step

- Set permanent thresholds in [nolapse.yaml](/reference/cli/#nolapseyaml) instead of passing flags every time.
- See the full [CLI Reference](/reference/cli/) for every flag accepted by `nolapse run`.
- Read [Exit Codes](/reference/exit-codes/) for a complete table of all possible exit codes.
