---
title: Go
description: How nolapse measures and enforces coverage for Go projects using go test -cover.
---

nolapse has first-class support for Go. The built-in Go runner wraps `go test` and extracts per-package coverage from its output — no external tools or configuration files beyond `nolapse.yaml` are required.

## Prerequisites

- **Go 1.22 or later** must be on `PATH`.
- Your repository must have at least one `_test.go` file. nolapse skips packages with no tests rather than treating them as 0% — see [Coverage is a mean across packages](#coverage-is-a-mean-across-packages) below.
- A baseline must exist before enforcement can run. If you have not created one yet, see the [baseline init](/baseline/init/) guide.

## How coverage is extracted

When you run `nolapse run --repo .`, the runner executes:

```bash
go test -coverprofile=<tmpfile> ./...
```

It captures stdout and parses every line that matches:

```text
coverage: X.X% of statements
```

One such line is emitted per tested package. Packages with no test files are skipped by `go test` entirely and produce no output line — they are excluded from the mean. nolapse collects all reported percentages and computes an **arithmetic mean** as the project-level figure. The temporary coverage profile file is deleted after parsing.

The Go runner enforces a **10-minute timeout** on the entire `go test` invocation. Very large codebases that approach this limit should consider splitting into sub-modules (see [Monorepos](#monorepos)).

## Initialising a baseline

From your repository root:

```bash
nolapse baseline init --repo .
```

nolapse invokes the Go runner, measures current coverage, and writes a `nolapse-baseline.json` file. Commit this file to version control so CI can compare against it on every pull request.

## Running nolapse

```bash
nolapse run --repo .
```

Go is the default language, so `--lang go` is optional but accepted.

### Example output

```text
nolapse: running go test -coverprofile=/tmp/nolapse-123456.out ./...
nolapse: packages measured: 7
nolapse: package coverage
  github.com/acme/myapp/api        82.4%
  github.com/acme/myapp/db         74.1%
  github.com/acme/myapp/handlers   91.0%
  github.com/acme/myapp/models     68.3%
  github.com/acme/myapp/queue      55.2%
  github.com/acme/myapp/util       100.0%
  github.com/acme/myapp/worker     77.8%
nolapse: mean coverage: 78.4%
nolapse: baseline coverage: 79.1%
nolapse: delta: -0.7%
nolapse: warn threshold: -1.0%  fail threshold: -5.0%
nolapse: result: PASS (delta within warn threshold)
```

Exit code `0` means pass. Exit code `1` means the fail threshold was breached. See [Exit codes](/reference/exit-codes/) for the full table.

## nolapse.yaml for Go projects

```yaml
lang: go
warn_threshold: -1.0
fail_threshold: -5.0
strict_mode: false
```

Place `nolapse.yaml` in the root of the directory you pass to `--repo`. The file is optional — the values above are the defaults.

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `lang` | string | `go` | Runner to use. |
| `warn_threshold` | float | `-1.0` | Delta below which a warning is emitted (e.g. `-1.0` = warn if coverage drops more than 1 pp). |
| `fail_threshold` | float | `-5.0` | Delta below which nolapse exits 1. |
| `strict_mode` | bool | `false` | When `true`, any negative delta causes a failure regardless of thresholds. |

## Monorepos

If your monorepo contains multiple Go modules in separate subdirectories, run nolapse once per module by pointing `--repo` at each module root:

```bash
nolapse run --repo ./services/auth
nolapse run --repo ./services/billing
nolapse run --repo ./services/notifications
```

Each invocation maintains its own baseline (`nolapse-baseline.json` lives inside the `--repo` directory). This avoids the mean-dilution problem that arises from running `go test ./...` from a workspace root that spans unrelated modules with very different coverage levels.

For a `go.work` workspace where you want a single aggregate figure, use the [custom runner](/languages/custom/) pattern to collect results across all modules and emit the expected output format.

## Coverage is a mean across packages

nolapse computes a simple arithmetic mean of per-package coverage. This has a few implications worth knowing:

- A large, poorly-tested package carries the same weight as a tiny, fully-tested one.
- Adding new packages with low coverage will lower the project mean even if you added tests for all new code.
- Deleting a well-tested package will also lower the mean.

For most projects the mean is a reliable proxy for overall test health and the delta enforcement catches regressions effectively. If you need coverage weighted by line count, the custom runner approach allows you to implement that metric yourself.

## Tips for accurate coverage

- **Exclude generated code.** Protobuf stubs, mock implementations, and database query files inflate the denominator. See [Excluding generated code](/how-to/exclude-generated/) for patterns.
- **Use build tags for integration tests.** Tag tests that require external services (`//go:build integration`) and run them under a separate baseline so they do not inflate normal CI time.
- **Avoid empty test packages.** A `package foo_test` file with no test functions is skipped by `go test`, keeping the package out of the mean — which is usually the right behaviour.
- **Run the race detector separately.** nolapse does not pass `-race` to `go test`. Run your race-detector checks in a parallel CI job to avoid bloating the coverage run time.
