---
title: "Tutorial: Nx Monorepo"
description: Preview of the planned Nx monorepo tutorial — per-package coverage thresholds and a matrix CI gate.
---

:::caution[Language support planned]
The Nx monorepo tutorial depends on Node.js support (`--lang nodejs`), which is not yet available. This page previews the tutorial content. No commands on this page will work until Node.js support is released.
:::

---

## What This Tutorial Will Cover

When Node.js support lands, this tutorial will walk through:

1. Setting up a new Nx workspace with two packages: a Node.js API library and a shared utilities library
2. Configuring Jest with `json-summary` coverage reporter per package
3. Running `nolapse init` once per package with its own baseline and `nolapse.yaml`
4. Running a per-package coverage check with `nolapse run --repo packages/api`
5. Adding a GitHub Actions matrix job that runs nolapse for each package in parallel
6. Setting different thresholds per package to account for varying coverage maturity

---

## Expected Workspace Structure

```text
my-nx-workspace/
├── packages/
│   ├── api/
│   │   ├── src/
│   │   ├── .audit/coverage/baseline.md
│   │   ├── nolapse.yaml
│   │   └── project.json
│   └── utils/
│       ├── src/
│       ├── .audit/coverage/baseline.md
│       ├── nolapse.yaml
│       └── project.json
├── nx.json
└── .github/
    └── workflows/
        └── coverage.yml
```

---

## Expected Commands (Once Available)

### Initialise each package

```bash
nolapse init --repo packages/api --lang nodejs
nolapse init --repo packages/utils --lang nodejs
```

### Check each package

```bash
nolapse run --repo packages/api --lang nodejs
nolapse run --repo packages/utils --lang nodejs
```

### GitHub Actions matrix workflow

```yaml
name: Coverage check

on:
  pull_request:

jobs:
  coverage:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        package: [packages/api, packages/utils]
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Set up Node
        uses: actions/setup-node@v4
        with:
          node-version: "20"

      - name: Install dependencies
        run: npm ci

      - name: Run nolapse — ${{ matrix.package }}
        uses: nolapse/nolapse-action@v1
        with:
          repo-token: ${{ secrets.GITHUB_TOKEN }}
          repo: ${{ matrix.package }}
          lang: nodejs
          warn-threshold: "0.5"
          fail-threshold: "1.0"
```

---

## Per-Package Thresholds

Each package's `nolapse.yaml` is independent, so you can set different thresholds:

```yaml
# packages/api/nolapse.yaml — critical path, tight threshold
lang: nodejs
warn_threshold: 0.1
fail_threshold: 0.5
```

```yaml
# packages/utils/nolapse.yaml — utility code, looser threshold
lang: nodejs
warn_threshold: 1.0
fail_threshold: 2.0
```

---

## Nx-Specific Considerations

- Nx's `nx affected` command can determine which packages changed in a PR. A future integration may allow nolapse to skip unchanged packages automatically, reducing CI time.
- Each package's baseline is entirely independent — adding a new package to the workspace does not affect existing baselines.
- The Nx cache does not interfere with nolapse's coverage measurement because nolapse invokes the test runner fresh each time.

---

## Get Notified

Watch the [nolapse changelog](/reference/changelog/) for the Node.js runner release. Once available, this tutorial will be updated with full working commands and example output.

---

## See Also

- [Monorepo Setup](/how-to/monorepo/) — the general monorepo guide (works today for Go and Python)
- [Multi-Language Projects](/how-to/multi-language/) — mixing language components
- [Tutorial: Go Microservice](/tutorials/go-microservice/) — a fully working tutorial available today
