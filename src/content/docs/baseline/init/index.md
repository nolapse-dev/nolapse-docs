---
title: "Initializing a Baseline"
description: Step-by-step guide to nolapse init — what it does, what it creates, and how to recover from common errors.
---

`nolapse init` sets up nolapse in a repository for the first time. It runs your test suite, records the current coverage as the baseline, and creates a `nolapse.yaml` template if one does not already exist.

## Prerequisites

- The repository must be a git repo with at least one commit.
- For Go projects: `go test` must be runnable from the repo root.
- For Python projects: `pytest` and `pytest-cov` must be installed.

## What `nolapse init` does

1. **Checks for an existing baseline.** If `.audit/coverage/baseline.md` already exists, init aborts unless `--force` is passed.
2. **Resolves the HEAD SHA.** Records the current commit hash to tie the baseline to a specific point in history.
3. **Runs the coverage tool.** Executes the language-specific runner (`go test -coverprofile=...` or `pytest --cov`) to measure current coverage.
4. **Creates `.audit/coverage/baseline.md`.** Writes the initial baseline file with the coverage percentage, timestamp, and commit SHA.
5. **Creates `nolapse.yaml`** (if not present). Writes a template with commented defaults so you can tune thresholds right away.

## Basic usage

```bash
# Go project (default)
nolapse init --repo .

# Python project
nolapse init --repo . --lang python

# Explicit path
nolapse init --repo /path/to/my-service
```

The `--repo` flag defaults to the current working directory, so `nolapse init` (no flags) works from the repo root.

## What gets created

After a successful init, two files are written:

### `.audit/coverage/baseline.md`

```text
coverage: 82.50%
timestamp: 2026-01-15T09:32:11Z
commit: a3f8c21d4e6b09f1c2d3e4f5a6b7c8d9e0f1a2b3
```

This file is the source of truth for all future `nolapse run` comparisons. It should be committed to your repository and treated as part of your CI configuration.

### `nolapse.yaml` (template)

```yaml
lang: go
warn_threshold: -1.0
fail_threshold: -3.0
strict_mode: false
```

Edit the thresholds to match your team's tolerance before committing. See [Thresholds](/config/thresholds/) for guidance.

## What to commit

After running `nolapse init`, commit both files:

```bash
git add .audit/coverage/baseline.md nolapse.yaml
git commit -m "chore: initialise nolapse coverage baseline"
```

Do not add `.nolapse_run_state` to git — it is a transient file used between `nolapse run` and `nolapse baseline update`.

## The `--force` flag

If a baseline already exists, `nolapse init` exits with an error:

```text
error: baseline already exists at .audit/coverage/baseline.md
       use --force to overwrite
```

Pass `--force` to overwrite the existing baseline with a fresh measurement:

```bash
nolapse init --repo . --force
```

:::caution[--force rewrites history]
`--force` replaces the existing baseline file entirely. Any previous baseline entries are lost. Use `nolapse baseline update` for routine baseline advancement after intentional coverage improvements.
:::

## Go vs Python variants

### Go

```bash
nolapse init --repo . --lang go
```

Internally runs something equivalent to:

```bash
go test -coverprofile=.nolapse_cover.out ./...
go tool cover -func=.nolapse_cover.out
```

### Python

```bash
nolapse init --repo . --lang python
```

Internally runs something equivalent to:

```bash
pytest --cov=. --cov-report=term-missing
```

Ensure `pytest-cov` is installed in the active environment before running init on a Python project.

## Troubleshooting

### "baseline already exists"

```text
error: baseline already exists at .audit/coverage/baseline.md
```

You have already run `nolapse init` in this repo. If you want to re-baseline from scratch, use `--force`. If you want to advance the baseline after a coverage improvement, use [`nolapse baseline update`](/baseline/update/) instead.

### "not a git repository"

```text
error: could not resolve HEAD: not a git repository
```

`nolapse init` requires a git repository with at least one commit. Run `git init && git commit` before running `nolapse init`.

### Coverage tool not found (Python)

```text
error: pytest not found in PATH
```

Install pytest and pytest-cov in the active environment:

```bash
pip install pytest pytest-cov
```

### Zero coverage reported

If nolapse reports `0.00%`, the coverage tool ran but found no test files or no instrumented packages. Check that:

- For Go: your `./...` pattern matches packages with `_test.go` files.
- For Python: your `--cov` target points at the source directory, not the test directory.
