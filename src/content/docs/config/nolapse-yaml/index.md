---
title: "nolapse.yaml"
description: Full reference for every field in nolapse.yaml — types, defaults, and scenario-based examples.
---

`nolapse.yaml` is the per-repository configuration file for nolapse. It controls which language runner is used, how aggressively coverage regressions are enforced, and whether warnings are treated as failures.

## File location and discovery

Place `nolapse.yaml` in the root of your repository — the same directory that contains your `.git` folder. nolapse looks for this file relative to the `--repo` path (which defaults to the current working directory).

```text
my-project/
├── .git/
├── .audit/
│   └── coverage/
│       └── baseline.md
├── nolapse.yaml   ← here
└── ...
```

If no `nolapse.yaml` is found, nolapse uses built-in defaults (see each field below).

## Schema

```yaml
lang: go              # go | python
warn_threshold: -1.0  # max tolerated regression before warn (negative = regression)
fail_threshold: -5.0  # max tolerated regression before fail (negative = regression)
strict_mode: false    # when true, warn exits 1 instead of 0
```

## Fields

### `lang`

| Type   | Default | Allowed values   |
| ------ | ------- | ---------------- |
| string | `go`    | `go`, `python`   |

Selects which coverage runner nolapse invokes when executing `nolapse run` and `nolapse init`.

- `go` — runs `go test -coverprofile=...` and parses `go tool cover` output.
- `python` — runs `pytest --cov` and parses the `coverage.py` summary.

```yaml
lang: python
```

### `warn_threshold`

| Type  | Default (no yaml) | Unit              |
| ----- | ----------------- | ----------------- |
| float | `-0.5`            | percentage points |

The minimum coverage delta before nolapse emits a warning. Values are expressed as **negative numbers** because they represent regressions (drops in coverage).

- A value of `-1.0` means: warn if coverage drops by more than 1.0 percentage point.
- The built-in default when no `nolapse.yaml` exists is equivalent to `-0.5`.

:::note[CLI flag takes positive values]
The corresponding CLI flag `--warn-threshold` accepts a **positive** value (e.g., `--warn-threshold 1.0`), which nolapse negates internally. The yaml field uses the negative convention to make the direction of enforcement explicit in config files.
:::

### `fail_threshold`

| Type  | Default (no yaml) | Unit              |
| ----- | ----------------- | ----------------- |
| float | `-1.0`            | percentage points |

The coverage delta at which nolapse exits non-zero. Must be a more negative value than `warn_threshold` (a larger allowed regression).

- A value of `-5.0` means: fail if coverage drops by more than 5.0 percentage points.
- The built-in default when no `nolapse.yaml` exists is equivalent to `-1.0`.

```yaml
fail_threshold: -5.0
```

:::caution[warn_threshold must be less negative than fail_threshold]
`warn_threshold` must always be closer to zero than `fail_threshold`. For example, `-1.0` (warn) and `-5.0` (fail) is valid. `-5.0` (warn) and `-1.0` (fail) is not.
:::

### `strict_mode`

| Type | Default | Effect                                          |
| ---- | ------- | ----------------------------------------------- |
| bool | `false` | When `true`, a warn result exits 1 instead of 0 |

By default, a warning is informational — nolapse prints a message but exits 0, so CI passes. Setting `strict_mode: true` causes warnings to also exit 1, blocking the pipeline.

```yaml
strict_mode: true
```

This is equivalent to passing `--strict-mode` on every `nolapse run` invocation.

## CLI flag overrides

All `nolapse.yaml` values can be overridden per-run using CLI flags. Flags always take precedence over the config file.

| yaml field        | CLI flag                    | Note                       |
| ----------------- | --------------------------- | -------------------------- |
| `warn_threshold`  | `--warn-threshold <float>`  | Positive value on CLI      |
| `fail_threshold`  | `--fail-threshold <float>`  | Positive value on CLI      |
| `strict_mode`     | `--strict-mode`             | Boolean flag (no value)    |
| `lang`            | `--lang <go\|python>`       | Selects runner             |

Example — temporarily tighten enforcement for a single run without changing the config file:

```bash
nolapse run --warn-threshold 0.1 --fail-threshold 0.5
```

## Example configurations

### Tight enforcement (production service)

Warn on any regression, fail on anything over 0.5 pp. Warnings block CI.

```yaml
lang: go
warn_threshold: -0.0
fail_threshold: -0.5
strict_mode: true
```

### Gradual adoption (legacy codebase)

Allow coverage to drift up to 3 pp before warning, 10 pp before failing. Gives teams time to improve without blocking every PR.

```yaml
lang: go
warn_threshold: -3.0
fail_threshold: -10.0
strict_mode: false
```

### Python project with moderate enforcement

```yaml
lang: python
warn_threshold: -1.0
fail_threshold: -3.0
strict_mode: false
```

### Strict Python project

```yaml
lang: python
warn_threshold: -0.5
fail_threshold: -1.0
strict_mode: true
```
