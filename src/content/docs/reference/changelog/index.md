---
title: Changelog
description: Version history and release notes for the nolapse CLI, runners, and GitHub Action.
---

## v0.1.0 — Initial release

This is the first public release of nolapse. It includes the CLI, Go and Python coverage runners, threshold enforcement logic, and a GitHub Action for pull request integration.

---

### CLI commands

All five top-level commands ship in this release:

| Command | Description |
| --- | --- |
| `nolapse init` | Measures current coverage and writes `.audit/coverage/baseline.md` and `nolapse.yaml`. |
| `nolapse run` | Compares current coverage against the baseline, applies thresholds, and exits with the appropriate code. |
| `nolapse baseline update` | Appends a new timestamped entry to the baseline audit trail and git-commits the result. |
| `nolapse audit list` | Prints the last 10 baseline entries from the audit trail. |
| `nolapse version` | Prints the CLI version string. |

Install via:

```bash
go install github.com/nolapse/nolapse-cli/nolapse-cli/cmd/nolapse@latest
```

---

### Go runner

The Go coverage runner is built into the CLI. It invokes `go test -cover ./...` against the target repository and parses the total coverage percentage from the output. No additional tooling is required for Go projects.

---

### Python runner

The Python coverage runner ships as a subprocess script at `nolapse-runner/coverage_runner.py`. The CLI invokes it via subprocess, passing the repository path as an argument. The script runs `pytest --cov` and returns the total coverage percentage.

Requirements for Python projects:

- `pytest` installed in the project's virtual environment.
- `pytest-cov` installed in the project's virtual environment.

The runner path can be overridden by setting the `NOLAPSE_RUNNER_PATH` environment variable to the absolute path of `coverage_runner.py`.

---

### Threshold enforcement

`nolapse run` implements a three-outcome model:

| Outcome | Condition | Default exit code |
| --- | --- | --- |
| pass | `delta > -warn_threshold` | `0` |
| warn | `delta > -fail_threshold` and not pass | `0` |
| fail | `delta ≤ -fail_threshold` | `1` |

Default thresholds: `warn_threshold = 0.5`, `fail_threshold = 1.0` (percentage points).

Strict mode (`--strict-mode` flag or `strict_mode: true` in `nolapse.yaml`) promotes warn → exit `1`, enabling zero-tolerance enforcement without tightening numeric thresholds.

---

### nolapse.yaml configuration

`nolapse init` writes a `nolapse.yaml` file at the repository root. All threshold values and the language setting are configurable here, and all can be overridden per-invocation via CLI flags.

```yaml
lang: go
warn_threshold: -1.0
fail_threshold: -5.0
strict_mode: false
```

---

### GitHub Action

The `nolapse/nolapse-action@v1` GitHub Action wraps the CLI for pull request workflows. Features in this release:

- Runs `nolapse run` against the checked-out repository.
- Posts a coverage table as a PR comment (opt-in via `coverage-table` input).
- Creates a GitHub check run with pass/warn/fail status.
- Accepts `warn-threshold`, `fail-threshold`, and `strict-mode` as inputs to override `nolapse.yaml` values.
- Requires a `repo-token` input (use `secrets.GITHUB_TOKEN`).

Minimum workflow example:

```yaml
- uses: nolapse/nolapse-action@v1
  with:
    repo-token: ${{ secrets.GITHUB_TOKEN }}
```
