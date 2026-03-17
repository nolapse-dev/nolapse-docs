---
title: Python
description: How nolapse measures and enforces coverage for Python projects using pytest and pytest-cov.
---

nolapse supports Python projects via a subprocess runner that invokes `pytest` and reads the resulting coverage data. The runner understands both the JSON report format (`coverage.json`) and the SQLite binary format (`.coverage`).

## Prerequisites

- **Python 3.8 or later** must be available as `python3` on `PATH`.
- **pytest** and **pytest-cov** must be installed in the Python environment used by the project:

```bash
pip install pytest pytest-cov
```

- A baseline must exist before enforcement can run. See [baseline init](/baseline/init/) if you have not created one yet.

## How the runner works

When you run `nolapse run --repo . --lang python`, nolapse:

1. Locates the runner script (`coverage_runner.py`). By default the script ships alongside the nolapse binary. You can override this with `NOLAPSE_RUNNER_PATH` — see [Overriding the runner path](#overriding-the-runner-path).
2. Invokes it as a subprocess: `python3 <script> <repo_path>`.
3. The subprocess runs `pytest --cov=. --cov-report=json` (or reads an existing `.coverage` file if `coverage.json` is not present).
4. The runner emits a structured summary line that nolapse parses.
5. nolapse compares the result against the stored baseline and applies threshold logic.

The Python runner enforces a **5-minute timeout** on the entire pytest invocation.

## Generating coverage data

nolapse expects one of two coverage outputs in the repo root:

### Option 1 — JSON report (recommended)

```bash
pytest --cov=. --cov-report=json
```

This produces `coverage.json`. The runner reads the `totals.percent_covered` field.

### Option 2 — SQLite binary

If `coverage.json` is not present, the runner falls back to reading the `.coverage` SQLite file that `pytest-cov` writes by default. This works without extra flags but is slightly slower to parse.

## Setting the language in nolapse.yaml

```yaml
lang: python
warn_threshold: -1.0
fail_threshold: -5.0
strict_mode: false
```

Place `nolapse.yaml` in the root of the directory you pass to `--repo`.

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `lang` | string | `go` | Set to `python` to activate the Python runner. |
| `warn_threshold` | float | `-1.0` | Warn if coverage drops by more than this many percentage points. |
| `fail_threshold` | float | `-5.0` | Fail (exit 1) if coverage drops by more than this many percentage points. |
| `strict_mode` | bool | `false` | When `true`, any negative delta is treated as a failure. |

## Initialising a baseline

```bash
nolapse baseline init --repo . --lang python
```

nolapse runs the Python runner, records the current coverage percentage, and writes `nolapse-baseline.json`. Commit this file so CI has a reference point.

## Running nolapse

```bash
nolapse run --repo . --lang python
```

### Example output

```text
nolapse: invoking python3 /usr/local/lib/nolapse/coverage_runner.py /home/ci/myproject
nolapse: coverage report found: coverage.json
nolapse: total coverage: 73.8%
nolapse: baseline coverage: 74.5%
nolapse: delta: -0.7%
nolapse: warn threshold: -1.0%  fail threshold: -5.0%
nolapse: result: PASS (delta within warn threshold)
```

## Overriding the runner path

If your environment cannot access the default runner location (for example, a restricted container image or an air-gapped environment), point nolapse at your own copy of `coverage_runner.py`:

```bash
export NOLAPSE_RUNNER_PATH=/opt/myorg/nolapse/coverage_runner.py
nolapse run --repo . --lang python
```

The `NOLAPSE_RUNNER_PATH` environment variable must be set before invoking nolapse. The script at that path is called with a single positional argument — the absolute path to the repo — and must emit the summary line on stdout.

## Example CI workflow

The following is a complete GitHub Actions example. See the [GitHub Actions](/ci/github-actions/) guide for the full action reference.

```yaml
name: Coverage
on: [pull_request]

jobs:
  coverage:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - uses: actions/setup-python@v5
        with:
          python-version: '3.12'

      - name: Install dependencies
        run: pip install pytest pytest-cov

      - name: Install nolapse
        run: go install github.com/nolapse/nolapse-cli/nolapse-cli/cmd/nolapse@latest

      - name: Coverage check
        uses: ./nolapse-gh-action
        with:
          repo-token: ${{ secrets.GITHUB_TOKEN }}
          warn-threshold: '1.0'
          fail-threshold: '5.0'
          pr-number: ${{ github.event.pull_request.number }}
```

## Tips for accurate coverage

- **Run pytest from the repo root** so relative import paths in `coverage.json` resolve correctly.
- **Exclude virtual environments.** Add `omit = .venv/*,venv/*` to your `.coveragerc` or `pyproject.toml` `[tool.coverage.run]` section so installed packages do not inflate the denominator.
- **Exclude migrations and generated files.** Django migration files and auto-generated gRPC stubs should be omitted from measurement. Use `omit` patterns in `.coveragerc`.
- **Use `--cov-source` to scope coverage.** `pytest --cov=src` restricts measurement to your `src/` tree, avoiding test files themselves from appearing as covered.
