---
title: Exit Codes
description: All nolapse exit codes, when they occur, and how CI/CD systems interpret them.
---

nolapse uses process exit codes so CI systems can act on results without parsing output text. There are three categories: success (exit `0`), enforcement failure (exit `1`), and error (any other non-zero code).

---

## Exit code table

| Code | Category | When it occurs |
| --- | --- | --- |
| `0` | Pass | `nolapse run` — delta is above the warn threshold. Coverage is healthy. |
| `0` | Warn | `nolapse run` — delta is below the warn threshold but above the fail threshold, and `--strict-mode` is off. |
| `1` | Fail | `nolapse run` — delta is at or below the fail threshold. Coverage regression is too large. |
| `1` | Strict warn | `nolapse run` — outcome is warn and `--strict-mode` is enabled. |
| Non-zero | Error | Any command — configuration problem, missing baseline, git unavailable, or test runner crash. |

---

## Outcome to exit code mapping

The `nolapse run` outcome is determined by comparing `delta` (current coverage minus baseline coverage) against the configured thresholds:

| Condition | Outcome | Exit code (normal) | Exit code (strict mode) |
| --- | --- | --- | --- |
| `delta > -warn_threshold` | pass | `0` | `0` |
| `-fail_threshold < delta ≤ -warn_threshold` | warn | `0` | `1` |
| `delta ≤ -fail_threshold` | fail | `1` | `1` |

Default thresholds: `warn_threshold = 0.5`, `fail_threshold = 1.0`.

---

## Strict mode

By default, a warn outcome exits `0`. This lets teams see a warning in the CI log without blocking the merge. When you want any regression — even a small one — to block merges, enable strict mode:

```bash
nolapse run --repo . --strict-mode
```

Or set it permanently in `nolapse.yaml`:

```yaml
strict_mode: true
```

With strict mode on, both warn and fail outcomes exit `1`.

---

## How CI/CD interprets exit codes

### GitHub Actions

A step that exits non-zero is marked as failed, which causes the job to fail. If the job is listed as a required status check on the branch, GitHub blocks the pull request from merging.

```yaml
- name: Enforce coverage
  run: nolapse run --repo .
  # Exit 1 from nolapse → step fails → job fails → merge blocked
```

To report without blocking, use `continue-on-error`:

```yaml
- name: Report coverage (non-blocking)
  run: nolapse run --repo .
  continue-on-error: true
```

### GitLab CI

A job that exits non-zero is marked as failed. Use `allow_failure: true` for a non-blocking report:

```yaml
coverage-check:
  script: nolapse run --repo .
  allow_failure: true   # warn without blocking pipeline
```

### CircleCI

Steps that exit non-zero fail the job. Use `when: always` with a custom outcome handling script if you want to report without failing.

---

## Error exits

Any exit code other than `0` or `1` from nolapse indicates a runtime or configuration error — not an enforcement decision. Common causes:

- `baseline.md` does not exist (run `nolapse init` first).
- `nolapse.yaml` is malformed or missing required fields.
- The git binary is not available in `PATH`.
- The test runner (`go test` or `pytest`) failed to produce coverage output.
- `NOLAPSE_RUNNER_PATH` points to a file that does not exist (Python projects).

Check the error message printed to stderr for the specific cause.
