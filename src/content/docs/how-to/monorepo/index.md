---
title: Monorepo Setup
description: Use --repo to track each component separately, with independent baselines and per-component CI jobs.
---

nolapse works with monorepos by treating each subdirectory as an independent repository. Each component gets its own `baseline.md` and `nolapse.yaml`, stored under that component's own `.audit/coverage/` directory. This means coverage enforcement is scoped to the component, not the whole monorepo.

---

## How It Works

The `--repo` flag tells nolapse which directory to treat as the repository root. Running `nolapse init --repo services/go-svc` creates:

```text
services/go-svc/
├── .audit/
│   └── coverage/
│       └── baseline.md   ← baseline for this component only
└── nolapse.yaml          ← config for this component only
```

Each component is independent. A coverage drop in `services/go-svc` does not affect the baseline of `services/py-svc`.

---

## Example Directory Structure

```text
my-monorepo/
├── services/
│   ├── go-svc/           ← Go microservice
│   │   ├── .audit/coverage/baseline.md
│   │   ├── nolapse.yaml
│   │   └── main.go
│   └── py-svc/           ← Python service
│       ├── .audit/coverage/baseline.md
│       ├── nolapse.yaml
│       └── app.py
├── frontend/             ← Not yet tracked by nolapse (Node.js, planned)
└── .github/
    └── workflows/
        └── coverage.yml
```

---

## Initialising Each Component

Run `nolapse init` once per component from the repo root:

```bash
# Go component
nolapse init --repo services/go-svc

# Python component
nolapse init --repo services/py-svc --lang python
```

Commit all generated files:

```bash
git add services/go-svc/.audit/coverage/baseline.md services/go-svc/nolapse.yaml
git add services/py-svc/.audit/coverage/baseline.md services/py-svc/nolapse.yaml
git commit -m "chore: add nolapse baselines for go-svc and py-svc"
```

---

## Running Checks Per Component

```bash
# Check go-svc
nolapse run --repo services/go-svc

# Check py-svc
nolapse run --repo services/py-svc --lang python
```

---

## GitHub Actions — Matrix Strategy

Use a matrix job to run each component in parallel:

```yaml
name: Coverage check

on:
  pull_request:

jobs:
  coverage:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        include:
          - repo: services/go-svc
            lang: go
          - repo: services/py-svc
            lang: python
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Run nolapse — ${{ matrix.repo }}
        uses: nolapse/nolapse-action@v1
        with:
          repo-token: ${{ secrets.GITHUB_TOKEN }}
          repo: ${{ matrix.repo }}
          lang: ${{ matrix.lang }}
          warn-threshold: "0.5"
          fail-threshold: "1.0"
```

Each matrix job runs independently. A failure in `services/go-svc` does not block the `services/py-svc` job. GitHub's branch protection can require all matrix jobs to pass before merging.

---

## Per-Component Thresholds

Each component's `nolapse.yaml` can have different thresholds. A legacy service with lower coverage can have a looser threshold while a critical service has a tighter one:

```yaml
# services/go-svc/nolapse.yaml (critical service — tight threshold)
lang: go
warn_threshold: 0.1
fail_threshold: 0.5
```

```yaml
# services/py-svc/nolapse.yaml (legacy service — looser threshold)
lang: python
warn_threshold: 1.0
fail_threshold: 3.0
```

---

## PACE-Enforced Per-Repo Baseline Files

Each subdirectory's baseline is entirely self-contained. The PACE enforcement model treats each `--repo` path as an independent unit. There is no aggregate monorepo baseline — only per-component baselines. This means:

- Deleting or modifying one component's `baseline.md` does not affect other components.
- You can onboard components one at a time without disrupting existing components.
- Each component's coverage history is tracked independently in the executions API.

---

## See Also

- [Multi-Language Projects](/how-to/multi-language/) — running Go and Python components side by side
- [Block PRs on Coverage Regression](/how-to/pr-gate/) — branch protection setup
- [Raise Your Coverage Threshold](/how-to/raise-threshold/) — per-component threshold tuning
