---
title: Troubleshooting
description: Common nolapse errors with exact error text, root causes, and step-by-step fixes.
---

This page covers the most common errors encountered when using nolapse, including the exact error message, why it happens, and how to fix it.

---

## 1. "baseline already exists"

**Error text:**

```text
error: baseline already exists at .audit/coverage/baseline.md
Use --force to overwrite the existing baseline.
```

**Cause:** You ran `nolapse init` on a repo that already has a `baseline.md`.

### Fix — Option A: Use `--force`

```bash
nolapse init --repo . --force
```

This overwrites the existing baseline with the current coverage measurement. Use this when you want to reset the baseline to the current state of the codebase.

### Fix — Option B: Delete the file manually

```bash
rm .audit/coverage/baseline.md
nolapse init --repo .
```

If the repo is shared, commit the updated baseline immediately after to avoid confusing teammates.

---

## 2. "no \*_test.go files found"

**Error text:**

```text
error: no *_test.go files found under path "."
nolapse requires at least one test file to measure coverage.
```

**Cause:** nolapse scanned the `--repo` path and found no Go test files.

**Fix:** Add at least one `_test.go` file. nolapse cannot extract a coverage percentage from a codebase with no tests. If you intentionally have zero tests (e.g. on a brand-new repo), create a minimal test file:

```go
package main_test

import "testing"

func TestPlaceholder(t *testing.T) {}
```

---

## 3. Python: `.coverage` file locked

**Error text:**

```text
error: .coverage database is locked (timeout after 300s)
Ensure no other pytest process is running against this directory.
```

**Cause:** Another `pytest` process (possibly a previous CI run that did not clean up, or a parallel test run) has an open write lock on the `.coverage` SQLite database.

**Fix:**

1. Check for stale processes: `ps aux | grep pytest`
2. Kill any lingering pytest: `kill <pid>`
3. Delete the locked file and re-run: `rm -f .coverage && nolapse run --repo .`
4. In CI, add a cleanup step before nolapse runs:

```yaml
- name: Clean stale coverage database
  run: rm -f .coverage
```

---

## 4. "coverage.json not found"

**Error text:**

```text
error: coverage.json not found. Run pytest with --cov-report=json.
```

**Cause:** nolapse's Python runner reads `coverage.json` produced by `pytest-cov`. If pytest was run without `--cov-report=json`, this file is not created.

### Fix — Option A: Add the flag to your pytest invocation

```bash
pytest --cov=. --cov-report=json
```

### Fix — Option B: Configure it in `pytest.ini` so it is always applied

```ini
[pytest]
addopts = --cov=. --cov-report=json
```

### Fix — Option C: Configure it in `pyproject.toml`

```toml
[tool.pytest.ini_options]
addopts = "--cov=. --cov-report=json"
```

Once the flag is in place, re-run `nolapse run --repo .` — it will invoke pytest internally and find `coverage.json`.

---

## 5. "no run state for baseline update"

**Error text:**

```text
error: no run state found. Run `nolapse run` before `nolapse baseline update`.
```

**Cause:** `nolapse baseline update` promotes the result of the most recent `nolapse run` to become the new baseline. If `nolapse run` has not been executed in the current session (or its state file was cleaned up), there is nothing to promote.

**Fix:**

```bash
nolapse run --repo .
nolapse baseline update --repo .
```

Always run these two commands in sequence. In CI, they are typically in the same job step on the main/release branch.

---

## 6. Exit code 1 in CI unexpectedly

**Symptom:** CI fails with exit code 1 from the nolapse step, but you did not intend to fail.

### Cause A: Coverage dropped since the last baseline

Check the nolapse output for `delta` and `outcome`. If delta is negative and exceeds `fail_threshold`, that is by design. Either improve coverage or update the baseline if the drop was intentional:

```bash
nolapse baseline update --repo .
git add .audit/coverage/baseline.md
git commit -m "chore: update nolapse baseline after intentional coverage reduction"
```

### Cause B: `--strict-mode` is active and the outcome was `warn`

Strict mode converts warn outcomes to exit 1. To allow warn outcomes in CI, remove `--strict-mode` or set `strict_mode: false` in `nolapse.yaml`.

### Cause C: Thresholds are misconfigured

Check `nolapse.yaml` — if `fail_threshold` is `0`, any negative delta (even `-0.01%`) will fail. Set a reasonable value:

```yaml
warn_threshold: 0.5
fail_threshold: 1.0
```

### Cause D: The wrong baseline is being read

If the `--repo` path does not match where `baseline.md` lives, nolapse may read a stale or wrong baseline. Verify with `cat .audit/coverage/baseline.md`.

---

## 7. GitHub Actions: "missing baseline"

**Error text:**

```text
error: baseline not found at .audit/coverage/baseline.md
Run `nolapse init` to create a baseline, then commit the file.
```

**Cause:** The baseline file exists locally but was not committed to the repository. When GitHub Actions checks out the repo, the file is missing.

**Fix:**

```bash
# Locally, after running nolapse init:
git add .audit/coverage/baseline.md nolapse.yaml
git commit -m "chore: add nolapse baseline"
git push
```

Verify the file is present in the remote:

```bash
git show HEAD:.audit/coverage/baseline.md
```

---

## 8. GitHub Actions: `actions/checkout` needs `fetch-depth: 0`

**Symptom:** `nolapse run` or `nolapse init` succeeds but git-related features (commit SHA in baseline, branch name in execution record) show incorrect or missing values.

**Cause:** By default, `actions/checkout` performs a shallow clone (depth 1). nolapse reads git metadata — specifically the current commit SHA and branch name — which require a full clone or at least access to git history.

**Fix:** Add `fetch-depth: 0` to your checkout step:

```yaml
- uses: actions/checkout@v4
  with:
    fetch-depth: 0
```

This is required for accurate commit SHAs in `baseline.md` and for `nolapse baseline update` to work correctly.

---

## Still Stuck?

1. Run through the [manual diagnostic checklist](/doctor/) to rule out common configuration issues.
2. Add `--verbose` to your nolapse command to get detailed output:

   ```bash
   nolapse run --repo . --verbose
   ```

3. Search [GitHub Discussions](https://github.com/nolapse-dev/nolapse-platform/discussions) for your error message.
4. File an issue at [github.com/nolapse-dev/nolapse-platform](https://github.com/nolapse-dev/nolapse-platform/issues) with the full command output and your `nolapse.yaml`.

---

## See Also

- [nolapse doctor](/doctor/) — planned automated diagnostic command
- [Exit Codes](/reference/exit-codes/) — full table of all exit codes
- [nolapse.yaml Reference](/config/nolapse-yaml/) — configuration schema
