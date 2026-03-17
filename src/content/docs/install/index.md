---
title: Install nolapse
description: How to install the nolapse CLI on macOS, Linux, and Windows, plus prerequisites for Go and Python projects.
---

nolapse ships as a single static binary built with Go. There are no external runtime dependencies for Go projects. Python projects require a small additional setup to provide test coverage data.

## Prerequisites

### All platforms

- **Go 1.22 or later** — required to build/install from source via `go install`. Verify with:

  ```bash
  go version
  # go version go1.22.0 darwin/arm64
  ```

  Download Go from [go.dev/dl](https://go.dev/dl/).

### Python projects only

nolapse drives Python coverage through `pytest` and `pytest-cov`. Install them in the same virtual environment your tests run in:

```bash
pip install pytest pytest-cov
```

The runner script (`nolapse-runner/coverage_runner.py`) is invoked as a subprocess by the CLI. If the script is not in the default location, set the `NOLAPSE_RUNNER_PATH` environment variable to its absolute path.

---

## Install via go install (recommended)

```bash
go install github.com/nolapse/nolapse-cli/nolapse-cli/cmd/nolapse@latest
```

This downloads, compiles, and places the `nolapse` binary in `$GOPATH/bin` (usually `~/go/bin`). Make sure that directory is on your `PATH`:

```bash
export PATH="$PATH:$(go env GOPATH)/bin"
```

Add that line to your shell profile (`~/.bashrc`, `~/.zshrc`, etc.) to make it permanent.

### Verify the installation

```bash
nolapse version
```

Expected output:

```text
nolapse v0.1.0
```

If you see `command not found`, confirm that `$(go env GOPATH)/bin` is in your `PATH`.

---

## Platform notes

### macOS

Homebrew support is planned but not yet available. Use `go install` above.

If you use Apple Silicon (arm64), Go and the resulting binary are native arm64 — no Rosetta needed.

### Linux

`go install` works on all major distributions. On minimal CI images that do not have Go pre-installed, use the official Go tarball installer:

```bash
curl -LO https://go.dev/dl/go1.22.5.linux-amd64.tar.gz
tar -C /usr/local -xzf go1.22.5.linux-amd64.tar.gz
export PATH="$PATH:/usr/local/go/bin:$HOME/go/bin"
go install github.com/nolapse/nolapse-cli/nolapse-cli/cmd/nolapse@latest
```

### Windows

Use `go install` from PowerShell or Command Prompt. The binary is placed in `%USERPROFILE%\go\bin`. Add that directory to your system `PATH` through **System Properties > Environment Variables**.

```powershell
go install github.com/nolapse/nolapse-cli/nolapse-cli/cmd/nolapse@latest
nolapse version
```

---

## Python project extra setup

After installing the CLI, make sure the coverage runner dependencies are available:

```bash
pip install pytest pytest-cov
```

Then confirm nolapse can find the runner. Run `nolapse init --lang python` inside your repo root. If the runner is installed in a non-standard location, point the CLI to it:

```bash
export NOLAPSE_RUNNER_PATH=/path/to/nolapse-runner/coverage_runner.py
```

You can set this variable in your CI workflow environment or in a `.env` file loaded before running nolapse.

---

## Next step

Once installed, continue to the [Quickstart](/quickstart/) to create your first baseline and run your first coverage check.
