---
title: CLI Reference
description: Complete reference for all nolapse commands, flags, defaults, and exit codes.
---

nolapse provides five top-level commands. Each is documented below with its synopsis, flags, and example output.

---

## nolapse init

Measure current coverage and write an initial baseline.

### init — synopsis

```bash
nolapse init [--repo <path>] [--lang go|python] [--force]
```

### init — flags

| Flag | Type | Default | Description |
| --- | --- | --- | --- |
| `--repo` | string | `.` (cwd) | Path to the repository root. |
| `--lang` | string | auto-detect | Language runner to use: `go` or `python`. |
| `--force` | bool | `false` | Overwrite an existing `baseline.md` and `nolapse.yaml`. |

### init — output files

- `.audit/coverage/baseline.md` — baseline header with `coverage`, `timestamp`, and `commit`.
- `nolapse.yaml` — configuration file with threshold defaults.

### init — exit codes

| Code | Meaning |
| --- | --- |
| `0` | Baseline written successfully. |
| Non-zero | Error: git not available, test runner failed, or `--force` not passed when baseline exists. |

### init — example

```bash
nolapse init --repo . --lang go
```

```text
Initialized baseline: .audit/coverage/baseline.md
coverage: 82.50%  commit: a1b2c3d4...  timestamp: 2026-01-15T09:00:00Z
```

---

## nolapse run

Measure current coverage, compare against the baseline, and enforce thresholds.

### run — synopsis

```bash
nolapse run [--repo <path>] [--lang go|python] [--warn-threshold N] [--fail-threshold N] [--strict-mode]
```

### run — flags

| Flag | Type | Default | Description |
| --- | --- | --- | --- |
| `--repo` | string | `.` (cwd) | Path to the repository root. |
| `--lang` | string | from `nolapse.yaml` | Language runner to use: `go` or `python`. |
| `--warn-threshold` | float | `0.5` | Coverage drop (percentage points) that triggers a warn outcome. |
| `--fail-threshold` | float | `1.0` | Coverage drop (percentage points) that triggers a fail outcome. |
| `--strict-mode` | bool | `false` | Promote warn → exit code `1`. |

Flags override the corresponding values in `nolapse.yaml`.

### run — threshold logic

| Condition | Outcome | Exit code |
| --- | --- | --- |
| `delta > -warn_threshold` | pass | `0` |
| `delta > -fail_threshold` (and not pass) | warn | `0` (or `1` with `--strict-mode`) |
| `delta ≤ -fail_threshold` | fail | `1` |

### run — exit codes

| Code | Meaning |
| --- | --- |
| `0` | Pass or warn outcome. |
| `1` | Fail outcome (regression exceeds fail threshold) or warn with `--strict-mode`. |
| Non-zero | Error: missing baseline, git error, test runner crash. |

### run — example

```bash
nolapse run --repo .
```

```text
file  baseline coverage  PR coverage  delta    outcome
.     80.00%             82.30%       +2.30%   pass

outcome: pass  delta: +2.30  coverage: 82.30%  baseline: 80.00%  outcome: pass
warn_threshold: 0.5  fail_threshold: 1.0
Coverage delta: +2.30% (threshold: 0.5%)  pass
```

---

## nolapse baseline update

Append a new entry to the baseline audit trail and promote it as the active baseline.

### baseline update — synopsis

```bash
nolapse baseline update [--repo <path>]
```

### baseline update — flags

| Flag | Type | Default | Description |
| --- | --- | --- | --- |
| `--repo` | string | `.` (cwd) | Path to the repository root. |

### baseline update — behavior

1. Runs the test suite to measure current coverage.
2. Appends a pipe-delimited line to `.audit/coverage/baseline.md`:

   ```text
   2026-02-01T14:22:00Z | 83.10% | b2c3d4e5f6...
   ```

3. Updates the header block (`coverage:`, `timestamp:`, `commit:`) to the new values.
4. Creates a git commit with the updated file.

### baseline update — exit codes

| Code | Meaning |
| --- | --- |
| `0` | Baseline updated and committed. |
| Non-zero | Error: git not available, test runner failed, nothing to commit. |

### baseline update — example

```bash
nolapse baseline update --repo .
```

```text
Baseline updated: 82.50% → 83.10%
Committed: .audit/coverage/baseline.md
```

---

## nolapse audit list

Show the last 10 baseline update entries from the audit trail.

### audit list — synopsis

```bash
nolapse audit list [--repo <path>]
```

### audit list — flags

| Flag | Type | Default | Description |
| --- | --- | --- | --- |
| `--repo` | string | `.` (cwd) | Path to the repository root. |

### audit list — exit codes

| Code | Meaning |
| --- | --- |
| `0` | List printed successfully. |
| Non-zero | Error: baseline file not found or unreadable. |

### audit list — example

```bash
nolapse audit list --repo .
```

```text
TIMESTAMP                  COVERAGE  COMMIT
2026-02-15T11:05:00Z       84.00%    c3d4e5f6...
2026-02-01T14:22:00Z       83.10%    b2c3d4e5...
2026-01-15T09:00:00Z       82.50%    a1b2c3d4...
```

---

## nolapse version

Print the nolapse CLI version string.

### version — synopsis

```bash
nolapse version
```

No flags accepted.

### version — exit codes

| Code | Meaning |
| --- | --- |
| `0` | Version printed successfully. |

### version — example

```bash
nolapse version
```

```text
nolapse v0.1.0
```

---

## nolapse.yaml

The configuration file written by `nolapse init` and read by `nolapse run`.

```yaml
lang: go              # go | python
warn_threshold: -1.0  # negative float, percentage points
fail_threshold: -5.0  # negative float, percentage points
strict_mode: false    # bool
```

| Key | Type | Description |
| --- | --- | --- |
| `lang` | string | Language runner: `go` or `python`. |
| `warn_threshold` | float | Warn when delta drops below this value (expressed as a negative number). |
| `fail_threshold` | float | Fail when delta drops to or below this value (expressed as a negative number). |
| `strict_mode` | bool | When `true`, warn outcomes exit with code `1`. |

Command-line flags always override `nolapse.yaml` values for a single invocation.

---

## Environment variables

| Variable | Description |
| --- | --- |
| `NOLAPSE_RUNNER_PATH` | Absolute path to `coverage_runner.py`. Overrides the default lookup for Python projects. |
