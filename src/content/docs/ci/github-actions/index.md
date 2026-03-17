---
title: GitHub Actions
description: Full guide to the nolapse GitHub Action — workflow YAML, all inputs, Check Run posting, and PR comments.
---

The nolapse GitHub Action runs `nolapse run` in CI, posts a GitHub **Check Run** on the commit, and optionally adds a coverage-delta comment to the pull request. It wraps the CLI so you do not need to manage baseline files or exit-code logic manually.

## Action location

The action lives inside the `nolapse-dev/nolapse-platform` monorepo at path `nolapse-gh-action`. A dedicated public action repository is in progress; in the meantime reference it with `uses: ./nolapse-gh-action` from a workflow that has already checked out the monorepo, or pin a released version once available.

## Complete workflow example

The following workflow runs on every pull request, sets up Go, installs nolapse, and delegates to the action for enforcement and reporting.

```yaml
name: Coverage
on: [pull_request]

jobs:
  coverage:
    runs-on: ubuntu-latest
    permissions:
      checks: write        # required to post Check Runs
      pull-requests: write # required to post PR comments
      contents: read

    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0   # full history lets nolapse find the baseline commit

      - uses: actions/setup-go@v5
        with:
          go-version: '1.22'

      - name: Install nolapse
        run: go install github.com/nolapse/nolapse-cli/nolapse-cli/cmd/nolapse@latest

      - name: Coverage check
        uses: ./nolapse-gh-action
        with:
          repo-token: ${{ secrets.GITHUB_TOKEN }}
          warn-threshold: '0.5'
          fail-threshold: '1.0'
          pr-number: ${{ github.event.pull_request.number }}
          coverage-table: 'true'
```

### Python project variant

Replace the Go setup steps with:

```yaml
      - uses: actions/setup-python@v5
        with:
          python-version: '3.12'

      - name: Install test dependencies
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

Your `nolapse.yaml` must contain `lang: python` for the runner to be selected.

## Action inputs

| Input | Required | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `repo-token` | yes | string | — | GitHub token with `checks: write` scope. Use `${{ secrets.GITHUB_TOKEN }}`. |
| `warn-threshold` | no | string | `1.0` | Coverage drop (in percentage points) that triggers a warning. Passed as `--warn-threshold` to the CLI. |
| `fail-threshold` | no | string | `5.0` | Coverage drop that causes the action to exit non-zero and fail the workflow. |
| `strict-mode` | no | string | `false` | Set to `'true'` to fail on any negative delta regardless of thresholds. |
| `pr-number` | no | string | — | Pull request number. When provided, the action posts a coverage-delta comment to the PR. Obtain with `${{ github.event.pull_request.number }}`. |
| `coverage-table` | no | string | `false` | Set to `'true'` to include a per-package breakdown table in the PR comment. |

Threshold inputs are strings (GitHub Actions does not have a native float type) and are passed through to the CLI unchanged. Use decimal notation: `'1.5'`, not `1.5`.

## What the action does

1. Runs `nolapse run --repo .` (using settings from `nolapse.yaml` in the repo root, overridden by any threshold inputs).
2. Parses the exit code and nolapse output.
3. Posts a **GitHub Check Run** on the triggering commit with a pass/warn/fail conclusion and a summary of the coverage delta.
4. If `pr-number` is set, posts or updates a PR comment with the delta and (optionally) a per-package table.
5. Exits non-zero if the fail threshold was breached, causing the workflow job to fail.

## Troubleshooting

### "Resource not accessible by integration" on Check Run post

The workflow job needs `checks: write` permission. Add a `permissions:` block to the job:

```yaml
permissions:
  checks: write
  pull-requests: write
  contents: read
```

If the repository uses a restrictive default permissions policy, a repository admin may need to allow workflow write permissions under **Settings → Actions → General → Workflow permissions**.

### "baseline not found" error

nolapse requires a `nolapse-baseline.json` in the `--repo` directory before `run` can compare. If you have not initialised one yet:

```bash
nolapse baseline init --repo .
git add nolapse-baseline.json
git commit -m "chore: add nolapse baseline"
git push
```

The baseline file must be committed to the branch that CI checks out. If you recently added the file but the CI run is on an older commit, rebase or merge `main` into your branch.

### No coverage delta on first run

If the baseline was committed on the same commit that the PR is comparing against, the delta will be `0.0%`. This is expected on first setup. Subsequent PRs will show real deltas.

### Go test timeout

The Go runner has a 10-minute timeout. If your test suite is slow, add `-timeout 20m` via a custom `go test` invocation using the [custom runner](/languages/custom/) pattern, or split coverage runs per package using `--repo` pointing to sub-module directories.
