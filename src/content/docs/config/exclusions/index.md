---
title: "Exclusions"
description: File and path exclusions are a planned P1 feature. This page covers the planned interface and current workarounds.
---

:::caution[Not yet available]
File and path exclusions are a **planned P1 feature** and are not available in the current release. This page documents the planned interface and practical workarounds you can use today.
:::

## Planned interface

When exclusions ship, they will be configured as a list of glob patterns under an `exclude` key in `nolapse.yaml`:

```yaml
# Planned — not yet supported
lang: go
warn_threshold: -1.0
fail_threshold: -3.0
exclude:
  - "**/*_generated.go"
  - "internal/testdata/**"
  - "vendor/**"
```

Patterns will follow standard glob syntax. Matched files will be omitted from the coverage calculation before nolapse compares against the baseline.

## Current workarounds

Until exclusions are implemented, you can exclude files at the coverage tool level rather than at the nolapse level.

### Go — build tags

Use a build tag to prevent test files or generated files from being instrumented:

```go
//go:build ignore
```

Or use `-coverpkg` to limit which packages are measured:

```bash
go test -coverpkg=./internal/...,./pkg/... ./...
```

You can also exclude specific packages by listing only the ones you want:

```bash
go test -coverprofile=coverage.out $(go list ./... | grep -v '/vendor/' | grep -v '/generated/')
```

### Go — coverage profile filtering

After generating a coverage profile, strip unwanted lines before nolapse reads it:

```bash
go test -coverprofile=coverage.out ./...
grep -v "_generated.go" coverage.out > coverage.filtered.out
```

Then point nolapse at the filtered profile (exact flag name subject to change in future releases — check `nolapse run --help`).

### Python — pytest `--ignore`

Use `pytest --ignore` to exclude directories from test collection and coverage measurement:

```bash
pytest --cov=src --ignore=src/generated --ignore=tests/fixtures
```

Or add persistent ignores to `pytest.ini` / `pyproject.toml`:

```ini
# pytest.ini
[pytest]
addopts = --ignore=src/generated
```

```toml
# pyproject.toml
[tool.pytest.ini_options]
addopts = "--ignore=src/generated"
```

### Python — `.coveragerc` omit

Use `.coveragerc` to omit paths from coverage reporting:

```ini
# .coveragerc
[run]
omit =
    src/generated/*
    tests/fixtures/*
    **/conftest.py
```

Or in `pyproject.toml`:

```toml
[tool.coverage.run]
omit = [
    "src/generated/*",
    "tests/fixtures/*",
]
```

## Tracking the feature

The exclusions feature is tracked as a P1 item on the nolapse roadmap. When it ships, the `exclude` key will be added to the `nolapse.yaml` schema and this page will be updated with the full reference.
