---
title: Self-Hosted Runners
description: Run nolapse on a GitHub Actions self-hosted runner — prerequisites, installation, and Python support.
---

nolapse works with GitHub Actions self-hosted runners without any special configuration. This page covers the prerequisites your runner machine must satisfy and how to pre-install the nolapse binary for faster job startup.

---

## Prerequisites

### All projects

- **Git** — must be on `PATH`. nolapse reads git metadata (commit SHA, branch name).
- **Network access** — the runner needs outbound HTTPS to download the nolapse binary during install (unless you pre-install it — see below). If using cloud features (badge, executions history), the runner also needs access to `https://api.nolapse.dev`.

### Go projects

- **Go 1.21 or later** — must be on `PATH`. nolapse uses `go test -cover` internally.
- Verify: `go version`

### Python projects

- **Python 3.9 or later** — must be on `PATH` as `python3` or `python`.
- **pytest and pytest-cov** installed in the test environment: `pip install pytest pytest-cov`
- Verify: `python3 -m pytest --version`

---

## Option A: Install nolapse in the Workflow Step

This is the default approach — nolapse is installed at the start of each job:

```yaml
jobs:
  coverage:
    runs-on: [self-hosted, linux]
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Run nolapse
        uses: nolapse/nolapse-action@v1
        with:
          repo-token: ${{ secrets.GITHUB_TOKEN }}
          warn-threshold: "0.5"
          fail-threshold: "1.0"
```

The `nolapse/nolapse-action@v1` action installs the nolapse binary automatically if it is not already on `PATH`. The action requires Go to be available on the runner for the install step.

---

## Option B: Pre-Install the nolapse Binary

Pre-installing avoids the install overhead on every job. On the runner machine:

```bash
go install github.com/nolapse/nolapse-cli/nolapse-cli/cmd/nolapse@latest
```

Ensure the Go binary path (`$(go env GOPATH)/bin`) is in the runner's `PATH`. Test it:

```bash
nolapse version
# nolapse v0.1.0
```

Once pre-installed, the GitHub Actions step can call nolapse directly without the action:

```yaml
      - name: Run nolapse
        run: nolapse run --repo . --warn-threshold 0.5 --fail-threshold 1.0
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

### Keeping the Binary Up to Date

Re-run the install command to update to the latest version:

```bash
go install github.com/nolapse/nolapse-cli/nolapse-cli/cmd/nolapse@latest
```

For version-pinned installations:

```bash
go install github.com/nolapse/nolapse-cli/nolapse-cli/cmd/nolapse@v0.1.0
```

---

## Python Projects on Self-Hosted Runners

For Python projects, ensure the runner has the test dependencies installed. The cleanest approach is to install dependencies in the workflow:

```yaml
jobs:
  coverage-python:
    runs-on: [self-hosted, linux]
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Install Python dependencies
        run: pip install -r requirements.txt pytest pytest-cov

      - name: Run nolapse
        uses: nolapse/nolapse-action@v1
        with:
          repo-token: ${{ secrets.GITHUB_TOKEN }}
          lang: python
          warn-threshold: "0.5"
          fail-threshold: "1.0"
```

If the runner is shared across many jobs and you want to avoid repeated installs, create a virtual environment as part of the runner's base image setup.

---

## Air-Gapped Runners

If the runner has no outbound internet access:

1. Download the nolapse binary on a machine with internet access and transfer it to the runner.
2. Place the binary in a directory on the runner's `PATH`.
3. Use the direct `run: nolapse run ...` step instead of `uses: nolapse/nolapse-action@v1` (the action tries to fetch the latest version on startup).
4. nolapse's core gate functionality (read baseline, run tests, compare, exit code) works entirely offline. Cloud features (badge, executions API) require network access to `api.nolapse.dev`.

---

## See Also

- [Block PRs on Coverage Regression](/how-to/pr-gate/) — full branch protection and Actions setup
- [Monorepo Setup](/how-to/monorepo/) — matrix strategy for multi-component repos
- [Install nolapse](/install/) — full installation options and prerequisites
