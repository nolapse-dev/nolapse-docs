---
title: Multi-Language Projects
description: Run nolapse once per language component in a repo that has both Go and Python services.
---

If your repository contains components in more than one language, run `nolapse` once per component with the appropriate `--lang` flag. Each component gets its own baseline and `nolapse.yaml`.

---

## Supported Languages

| Language | `--lang` value | Status |
| --- | --- | --- |
| Go | `go` (default) | Supported |
| Python | `python` | Supported |
| Node.js | `nodejs` | Planned |
| Java | `java` | Planned |
| .NET | `dotnet` | Planned |

---

## Example: Go + Python in One Repo

```text
my-repo/
├── services/
│   ├── go-svc/        ← Go HTTP service
│   └── py-svc/        ← Python FastAPI service
└── .github/
    └── workflows/
        └── coverage.yml
```

### Initialise each component

```bash
nolapse init --repo services/go-svc
nolapse init --repo services/py-svc --lang python
```

### Run checks individually

```bash
# Go component
nolapse run --repo services/go-svc

# Python component
nolapse run --repo services/py-svc --lang python
```

---

## GitHub Actions — Multi-Job Workflow

Use separate jobs (not matrix) when each language requires different setup steps:

```yaml
name: Coverage check

on:
  pull_request:

jobs:
  coverage-go:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Set up Go
        uses: actions/setup-go@v5
        with:
          go-version: "1.22"

      - name: Run nolapse (Go)
        uses: nolapse/nolapse-action@v1
        with:
          repo-token: ${{ secrets.GITHUB_TOKEN }}
          repo: services/go-svc
          lang: go
          warn-threshold: "0.5"
          fail-threshold: "1.0"

  coverage-python:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Set up Python
        uses: actions/setup-python@v5
        with:
          python-version: "3.12"

      - name: Install dependencies
        run: pip install -r services/py-svc/requirements.txt pytest pytest-cov

      - name: Run nolapse (Python)
        uses: nolapse/nolapse-action@v1
        with:
          repo-token: ${{ secrets.GITHUB_TOKEN }}
          repo: services/py-svc
          lang: python
          warn-threshold: "0.5"
          fail-threshold: "1.0"
```

The two jobs run in parallel. Each one reports its own check status to GitHub, and branch protection can require both to pass.

---

## Language Detection

If `lang` is set in a component's `nolapse.yaml`, you do not need to pass `--lang` on the command line:

```yaml
# services/py-svc/nolapse.yaml
lang: python
warn_threshold: 0.5
fail_threshold: 1.0
```

With this in place, `nolapse run --repo services/py-svc` automatically uses the Python runner.

---

## Independent Thresholds per Language

Go services and Python services often have different coverage baselines due to generated code, boilerplate, and test tooling differences. Set thresholds independently in each component's `nolapse.yaml`:

```yaml
# services/go-svc/nolapse.yaml
lang: go
warn_threshold: 0.5
fail_threshold: 1.0
```

```yaml
# services/py-svc/nolapse.yaml
lang: python
warn_threshold: 1.0
fail_threshold: 2.0
```

---

## See Also

- [Monorepo Setup](/how-to/monorepo/) — full monorepo guide with matrix CI strategy
- [Python Language Reference](/languages/python/) — pytest-cov setup and `.coveragerc` configuration
- [Go Language Reference](/languages/go/) — `go test -cover` details and build tag exclusions
