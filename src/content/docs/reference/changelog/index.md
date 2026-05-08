---
title: Changelog
description: Version history and release notes for the nolapse CLI, runners, and GitHub Action.
---

## v0.2.0 — Security hardening

This release delivers a full two-phase security hardening of the nolapse platform. No breaking changes to the CLI or `nolapse.yaml` schema. The token format has changed from mixed-case alphanumeric to lowercase hex (see below).

### Breaking changes

**Token format — lowercase hex only**

Tokens now use lowercase hex characters `[0-9a-f]` in the 40-character body, not mixed-case alphanumeric. Existing tokens issued before this release remain valid. New tokens look like:

```text
nlp_3f7a2c1b0e4d9a8f5c6b2e1d0a3f7c4b9e2d1a0f
```

Secret-scanning patterns that check for `nlp_[A-Za-z0-9]{40}` continue to match (lowercase hex is a subset of alphanumeric). No change is needed in CI secrets — the token value you stored is still valid.

**Token storage — hash only**

Raw token secrets are no longer stored in the database. The platform stores only a bcrypt hash (cost 12). Token validation now uses `SELECT WHERE id = $1` (O(1) primary-key lookup) followed by bcrypt comparison. There is no change to the API surface.

**CORS — origin allowlist replaces wildcard**

`Access-Control-Allow-Origin: *` has been replaced with an explicit allowlist controlled by the `ALLOWED_ORIGINS` environment variable (comma-separated origin list). Self-hosted deployments must set this variable. The cloud deployment is pre-configured. See [Security Model](/reference/security-model/).

### New platform features

**Session API (live)**

- `POST /v1/sessions/create` — creates a session (internal use by nolapse-web, requires `SERVICE_TOKEN`)
- `DELETE /v1/sessions/{id}` — deletes (logs out) a session

**Token management API (live)**

All token endpoints (`GET /v1/tokens`, `POST /v1/tokens`, `POST /v1/tokens/{id}/rotate`, `DELETE /v1/tokens/{id}`, `PATCH /v1/tokens/{id}`) are now live and require a valid session token.

**Webhook signature enforcement (live)**

- `POST /webhooks/stripe` — verifies `Stripe-Signature` header (HMAC-SHA256, 5-minute timestamp tolerance), fails closed if `STRIPE_WEBHOOK_SECRET` is not set
- `POST /webhooks/razorpay` — verifies `X-Razorpay-Signature` header (HMAC-SHA256), fails closed if `RAZORPAY_WEBHOOK_SECRET` is not set
- Both handlers include replay protection via the `webhook_events` table

**Audit logging**

The platform now emits structured `[audit]` log lines for security-relevant events: session create/delete, auth denial (with reason and remote address), token create/rotate/revoke.

### GitHub Action changes

- New optional input `nolapse-token`: when provided, the action validates the token before running coverage enforcement. Invalid/revoked tokens fail the job immediately.
- Threshold inputs (`warn-threshold`, `fail-threshold`) are now validated server-side before being passed to the CLI. Values containing shell metacharacters or extra flags are rejected. Both integers and decimals are accepted.
- All inputs are passed via environment variables (not inline `${{ }}` expressions) to prevent shell injection.

### Runner changes

- All language runners (`go`, `python`, `ruby`, `rust`, `java`, `kotlin`, `dotnet`, `php`, `swift`) now run subprocesses with a filtered environment. Platform secrets (`DATABASE_URL`, `SERVICE_TOKEN`, webhook secrets, session secrets) are stripped before user test code executes.

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
