---
title: nolapse doctor
description: Pre-flight diagnostic checks — what each check tests, expected output, and how to fix failures.
---

`nolapse doctor` is a planned P1 command that will run ten self-diagnostic checks against your local environment and configuration. It is designed to be the first thing you run when `nolapse run` fails unexpectedly.

:::note[Implementation status]
`nolapse doctor` is **planned (P1)**. It is not yet available. Use the manual checklist below while you wait.
:::

---

## Planned Command

```bash
nolapse doctor
```

No flags are required. The command inspects the current working directory and the environment.

### Expected Output (Once Implemented)

```text
nolapse doctor — running 10 checks

  [OK] git repository present
  [OK] baseline exists at .audit/coverage/baseline.md
  [OK] nolapse.yaml is valid
  [OK] Go 1.21.0 installed
  [OK] test files found (12 *_test.go files)
  [OK] coverage can be extracted (go test -cover ./... succeeded)
  [WARN] warn_threshold (0.5) is lower than the recommended minimum (1.0)
  [OK] CI environment not detected (local run)
  [OK] NOLAPSE_TOKEN is set and valid
  [OK] baseline is 3 days old (not stale)

9 passed, 1 warning.
```

A warning exits with code `0`. A failure exits with code `1` and prints a fix suggestion.

---

## The Ten Checks

### 1. Git repository present

Verifies that the current directory (or `--repo` path) is inside a git repository by checking for a `.git` directory or running `git rev-parse --git-dir`.

**Fix if failing:**

```bash
git init
```

---

### 2. Baseline exists

Checks that `.audit/coverage/baseline.md` exists at the repo root (or the path specified by `--repo`).

**Fix if failing:**

```bash
nolapse init --repo .
git add .audit/coverage/baseline.md nolapse.yaml
git commit -m "chore: add nolapse baseline"
```

---

### 3. nolapse.yaml is valid

Parses `nolapse.yaml` and verifies that all required fields are present and values are in range. Common validation failures: `lang` is not `go` or `python`, thresholds are negative, or the file is not valid YAML.

**Fix if failing:** Run `nolapse init --repo .` to regenerate a valid config, or compare your file against the [nolapse.yaml reference](/config/nolapse-yaml/).

---

### 4. Language runtime installed

For Go projects: checks that `go` is on `PATH` and reports the version.
For Python projects: checks that `python3` or `python` is on `PATH` and that `pytest` is installed.

**Fix if failing (Go):**

```bash
# Install Go from https://go.dev/dl/
go version
```

**Fix if failing (Python):**

```bash
pip install pytest pytest-cov
```

---

### 5. Test files present

For Go: searches for `*_test.go` files under the repo path.
For Python: searches for `test_*.py` or `*_test.py` files.

nolapse requires at least one test file to produce a meaningful coverage measurement.

**Fix if failing:** Add at least one test file. nolapse cannot measure coverage with zero tests.

---

### 6. Coverage can be extracted

Runs the test suite in a dry-run mode to confirm that coverage output can be parsed. For Go this is `go test -cover ./...`; for Python this is `pytest --cov --cov-report=json`.

This check catches misconfigured build tags, broken imports, missing dependencies, and broken test suites before `nolapse run` tries to use the output.

**Fix if failing:** Run the underlying test command manually and fix any errors:

```bash
# Go
go test -cover ./...

# Python
pytest --cov --cov-report=json
```

---

### 7. Thresholds are sane

Warns if `warn_threshold` or `fail_threshold` in `nolapse.yaml` are outside sensible ranges:

- Thresholds of `0` effectively disable enforcement — this is allowed but flagged as a warning.
- `fail_threshold < warn_threshold` is flagged as an error (the fail threshold should be larger than the warn threshold).
- Thresholds above `50` are flagged as a warning (very aggressive; likely to block all PRs).

---

### 8. CI environment detected

Checks for common CI environment variables (`CI`, `GITHUB_ACTIONS`, `GITLAB_CI`, `JENKINS_URL`). If detected, reminds you that `nolapse run` must be able to access the git history (`fetch-depth: 0` in GitHub Actions).

---

### 9. Token is set and valid

If `NOLAPSE_TOKEN` is set in the environment, calls `POST /v1/auth/validate` to confirm the token is active. Reports the `org_id` and `scopes` on success.

If `NOLAPSE_TOKEN` is not set, this check is skipped with a note that cloud features (badge, executions history) will not be available.

---

### 10. Baseline is not stale

Reads the `timestamp:` field from `baseline.md` and warns if it is older than 30 days. A stale baseline may cause misleading delta calculations if the codebase has changed significantly since the baseline was recorded.

**Fix if failing:**

```bash
nolapse run --repo .
nolapse baseline update --repo .
git add .audit/coverage/baseline.md
git commit -m "chore: refresh nolapse baseline"
```

---

## Manual Checklist (Use Until `doctor` Ships)

Until `nolapse doctor` is available, work through this checklist when debugging failures:

- [ ] You are inside a git repository (`git rev-parse --git-dir` succeeds)
- [ ] `.audit/coverage/baseline.md` exists and is committed
- [ ] `nolapse.yaml` exists and `lang` is set correctly
- [ ] The language runtime is installed (`go version` or `python3 --version`)
- [ ] At least one test file exists
- [ ] The test suite runs without errors (`go test ./...` or `pytest`)
- [ ] `NOLAPSE_TOKEN` is set if you use cloud features
- [ ] The baseline `timestamp:` is recent (within 30 days for active codebases)
- [ ] In GitHub Actions: `actions/checkout` uses `fetch-depth: 0`
- [ ] `fail_threshold` is greater than or equal to `warn_threshold` in `nolapse.yaml`

---

## See Also

- [Troubleshooting](/troubleshooting/) — specific error messages and fixes
- [nolapse.yaml Reference](/config/nolapse-yaml/) — full configuration schema
- [Your First Enforcement](/first-enforcement/) — how pass, warn, and fail outcomes work
