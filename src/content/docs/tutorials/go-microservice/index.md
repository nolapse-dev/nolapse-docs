---
title: "Tutorial: Go Microservice"
description: End-to-end walkthrough — create a Go HTTP service, add tests, init nolapse, simulate a regression, fix it, and add a GitHub Actions gate.
---

This tutorial takes you from an empty directory to a fully protected Go microservice with a nolapse coverage gate in GitHub Actions. It covers every command and shows the expected output at each step.

**Time to complete:** 30–45 minutes.

---

## Part 1 — Create the Go Service

### 1.1 Initialise the module

```bash
mkdir hello-svc && cd hello-svc
git init
go mod init github.com/example/hello-svc
```

### 1.2 Write the service

Create `handler.go`:

```go
package main

import (
    "encoding/json"
    "net/http"
)

type HealthResponse struct {
    Status string `json:"status"`
}

func healthHandler(w http.ResponseWriter, r *http.Request) {
    w.Header().Set("Content-Type", "application/json")
    json.NewEncoder(w).Encode(HealthResponse{Status: "ok"})
}

type GreetResponse struct {
    Message string `json:"message"`
}

func greetHandler(w http.ResponseWriter, r *http.Request) {
    name := r.URL.Query().Get("name")
    if name == "" {
        name = "world"
    }
    w.Header().Set("Content-Type", "application/json")
    json.NewEncoder(w).Encode(GreetResponse{Message: "Hello, " + name + "!"})
}

func main() {
    http.HandleFunc("/health", healthHandler)
    http.HandleFunc("/greet", greetHandler)
    http.ListenAndServe(":8080", nil)
}
```

### 1.3 Write the tests

Create `handler_test.go`:

```go
package main

import (
    "encoding/json"
    "net/http"
    "net/http/httptest"
    "testing"
)

func TestHealthHandler(t *testing.T) {
    req := httptest.NewRequest(http.MethodGet, "/health", nil)
    w := httptest.NewRecorder()
    healthHandler(w, req)

    if w.Code != http.StatusOK {
        t.Fatalf("expected 200, got %d", w.Code)
    }
    var resp HealthResponse
    json.NewDecoder(w.Body).Decode(&resp)
    if resp.Status != "ok" {
        t.Errorf("expected status ok, got %q", resp.Status)
    }
}

func TestGreetHandler_default(t *testing.T) {
    req := httptest.NewRequest(http.MethodGet, "/greet", nil)
    w := httptest.NewRecorder()
    greetHandler(w, req)

    var resp GreetResponse
    json.NewDecoder(w.Body).Decode(&resp)
    if resp.Message != "Hello, world!" {
        t.Errorf("unexpected message: %q", resp.Message)
    }
}

func TestGreetHandler_named(t *testing.T) {
    req := httptest.NewRequest(http.MethodGet, "/greet?name=Alice", nil)
    w := httptest.NewRecorder()
    greetHandler(w, req)

    var resp GreetResponse
    json.NewDecoder(w.Body).Decode(&resp)
    if resp.Message != "Hello, Alice!" {
        t.Errorf("unexpected message: %q", resp.Message)
    }
}
```

### 1.4 Run the tests

```bash
go test -cover ./...
```

Expected output:

```text
ok      github.com/example/hello-svc    0.003s  coverage: 85.7% of statements
```

---

## Part 2 — Add nolapse

### 2.1 Install the CLI

```bash
go install github.com/nolapse/nolapse-cli/nolapse-cli/cmd/nolapse@latest
nolapse version
# nolapse v0.1.0
```

### 2.2 Initialise the baseline

```bash
nolapse init --repo .
```

Expected output:

```text
measuring coverage...
coverage: 85.71%
baseline written to .audit/coverage/baseline.md
nolapse.yaml created
```

Inspect the baseline:

```bash
cat .audit/coverage/baseline.md
```

```text
coverage: 85.71%
timestamp: 2026-03-18T09:00:00Z
commit: a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2
```

### 2.3 Commit the baseline

```bash
git add .audit/coverage/baseline.md nolapse.yaml handler.go handler_test.go go.mod
git commit -m "chore: add nolapse coverage baseline"
```

### 2.4 Run a coverage check

```bash
nolapse run --repo .
```

Expected output (nothing has changed, so delta is 0):

```text
file  baseline coverage  PR coverage  delta    outcome
.     85.71%             85.71%       +0.00%   pass

outcome: pass  delta: +0.00  coverage: 85.71%  baseline: 85.71%
warn_threshold: 0.5  fail_threshold: 1.0
```

Exit code is `0` — pass.

---

## Part 3 — Simulate a Regression

### 3.1 Delete the named-greeting test

Open `handler_test.go` and remove `TestGreetHandler_named` entirely. Save the file.

### 3.2 Run nolapse again

```bash
nolapse run --repo .
```

Expected output:

```text
file  baseline coverage  PR coverage  delta    outcome
.     85.71%             71.43%       -14.28%  fail

outcome: fail  delta: -14.28  coverage: 71.43%  baseline: 85.71%
warn_threshold: 0.5  fail_threshold: 1.0
Coverage delta: -14.28% (threshold: 1.0%)  FAIL
```

Exit code is `1`. nolapse detected the regression.

### 3.3 Fix the regression

Add `TestGreetHandler_named` back to `handler_test.go`. Re-run:

```bash
nolapse run --repo .
```

```text
file  baseline coverage  PR coverage  delta    outcome
.     85.71%             85.71%       +0.00%   pass
```

Exit code is `0` again.

---

## Part 4 — Add the GitHub Action

### 4.1 Create the workflow file

Create `.github/workflows/coverage.yml`:

```yaml
name: Coverage check

on:
  pull_request:

jobs:
  coverage:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Set up Go
        uses: actions/setup-go@v5
        with:
          go-version: "1.22"

      - name: Run nolapse
        uses: nolapse/nolapse-action@v1
        with:
          repo-token: ${{ secrets.GITHUB_TOKEN }}
          warn-threshold: "0.5"
          fail-threshold: "1.0"
```

### 4.2 Commit and push

```bash
git add .github/workflows/coverage.yml
git commit -m "ci: add nolapse coverage gate"
git push -u origin main
```

### 4.3 Open a pull request

Create a feature branch, make a change, and open a PR. The Coverage check job will run automatically. If coverage drops more than 1 percentage point, the check fails and blocks the merge.

### 4.4 Enable branch protection (optional)

Go to **Settings → Branches** on your GitHub repository. Add a branch protection rule for `main`, enable **Require status checks to pass before merging**, and add **Coverage check / coverage** as a required check. From this point on, no PR can merge unless nolapse passes.

---

## What You Built

- A Go HTTP service with handler tests covering two endpoints
- A nolapse baseline committed to git
- A local verification loop: `nolapse run --repo .`
- A GitHub Actions workflow that fails PRs with coverage regressions
- Branch protection enforcing the check

---

## Next Steps

- [Raise Your Coverage Threshold](/how-to/raise-threshold/) — tighten the threshold once the team is comfortable with the gate
- [Monorepo Setup](/how-to/monorepo/) — extend nolapse to cover multiple Go services
- [Add a Coverage Badge](/how-to/badge/) — show coverage status in the README
