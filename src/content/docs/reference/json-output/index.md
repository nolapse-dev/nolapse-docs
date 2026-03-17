---
title: JSON Output
description: Current structured output format for nolapse run and the planned --output json flag.
---

nolapse does not yet expose a dedicated `--output json` flag, but it does emit a machine-readable summary line on stdout that scripts can parse. A full structured JSON output mode is on the roadmap as a P1 feature.

---

## Current output format

`nolapse run` prints several lines to stdout. The summary line is consistently structured and can be extracted with standard text tools:

```text
file  baseline coverage  PR coverage  delta    outcome
.     80.00%             82.30%       +2.30%   pass

outcome: pass  delta: +2.30  coverage: 82.30%  baseline: 80.00%  outcome: pass
warn_threshold: 0.5  fail_threshold: 1.0
Coverage delta: +2.30% (threshold: 0.5%)  pass
```

The key-value summary line (third line above) always contains these space-separated fields:

| Field | Format | Description |
| --- | --- | --- |
| `outcome` | `pass` / `warn` / `fail` | Enforcement outcome. |
| `delta` | signed float (e.g. `+2.30`) | Coverage change in percentage points. |
| `coverage` | float with `%` (e.g. `82.30%`) | Coverage measured in the current working tree. |
| `baseline` | float with `%` (e.g. `80.00%`) | Coverage read from `baseline.md`. |
| `warn_threshold` | float (e.g. `0.5`) | Active warn threshold. |
| `fail_threshold` | float (e.g. `1.0`) | Active fail threshold. |

### Extracting fields with grep and cut

```bash
# Get the outcome
nolapse run --repo . | grep '^outcome:' | awk '{print $2}'

# Get the delta
nolapse run --repo . | grep '^outcome:' | grep -oP 'delta: \K[^ ]+'

# Get the coverage percentage
nolapse run --repo . | grep '^outcome:' | grep -oP 'coverage: \K[^ ]+'
```

---

## The .nolapse_run_state file

After each `nolapse run` invocation, the CLI writes a JSON state file to the repository root at `.nolapse_run_state`. This file is intended for downstream tools (such as the GitHub Action) to consume without re-parsing stdout.

### Schema

```json
{
  "outcome": "pass",
  "delta": 2.30,
  "coverage": 82.30,
  "baseline": 80.00,
  "warn_threshold": 0.5,
  "fail_threshold": 1.0,
  "strict_mode": false,
  "timestamp": "2026-01-15T09:00:00Z",
  "commit": "a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2"
}
```

### Field definitions

| Field | Type | Description |
| --- | --- | --- |
| `outcome` | string | `"pass"`, `"warn"`, or `"fail"`. |
| `delta` | number | Coverage change in percentage points. Negative means regression. |
| `coverage` | number | Coverage percentage measured in the current working tree. |
| `baseline` | number | Coverage percentage read from `baseline.md`. |
| `warn_threshold` | number | Active warn threshold for this run. |
| `fail_threshold` | number | Active fail threshold for this run. |
| `strict_mode` | boolean | Whether strict mode was active for this run. |
| `timestamp` | string | ISO-8601 UTC timestamp of when `nolapse run` executed. |
| `commit` | string | 40-character git SHA of HEAD at the time of the run. |

### Reading the state file in a script

```bash
outcome=$(jq -r '.outcome' .nolapse_run_state)
delta=$(jq -r '.delta' .nolapse_run_state)
echo "Outcome: $outcome  Delta: $delta%"
```

---

## Planned: --output json (P1)

A `--output json` flag is planned as a P1 priority. When implemented, it will suppress the human-readable table and emit a single JSON object to stdout with the same schema as `.nolapse_run_state`. This will make nolapse composable with `jq` pipelines and other JSON-aware tooling without relying on the state file.

Until that flag ships, use `.nolapse_run_state` for structured consumption.
