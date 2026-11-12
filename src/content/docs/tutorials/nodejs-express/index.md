---
title: "Tutorial: Node.js Express API"
description: Preview of the planned Node.js tutorial — Express API with Jest coverage and a nolapse CI gate.
---

:::caution[Language support planned]
Node.js (`--lang nodejs`) is not yet available. This page previews what the tutorial will cover once the runner ships. No commands on this page will work until Node.js support is released.
:::

---

## What This Tutorial Will Cover

When Node.js support lands, this tutorial will walk through:

1. Creating a minimal Express HTTP API with two routes (`GET /health` and `GET /greet`)
2. Writing Jest tests with `--coverage` to generate a `coverage/coverage-summary.json` report
3. Running `nolapse init --repo . --lang nodejs` to create the baseline
4. Simulating a coverage regression by removing a test
5. Running `nolapse run --repo . --lang nodejs` and seeing it exit 1
6. Adding a GitHub Actions workflow that gates PRs on coverage

---

## Expected Project Structure

```text
hello-express/
├── src/
│   ├── handler.js
│   └── handler.test.js
├── package.json
├── jest.config.js
├── .audit/
│   └── coverage/
│       └── baseline.md
└── nolapse.yaml
```

---

## Expected Commands (Once Available)

### Initialise

```bash
nolapse init --repo . --lang nodejs
```

### Run a check

```bash
nolapse run --repo . --lang nodejs
```

### GitHub Actions workflow

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

      - name: Set up Node
        uses: actions/setup-node@v4
        with:
          node-version: "20"

      - name: Install dependencies
        run: npm ci

      - name: Run nolapse
        uses: nolapse-dev/nolapse-action@v1
        with:
          repo-token: ${{ secrets.GITHUB_TOKEN }}
          lang: nodejs
          warn-threshold: "0.5"
          fail-threshold: "1.0"
```

---

## Coverage Report Format

nolapse will read Jest's `coverage/coverage-summary.json` format. To generate it, Jest must be configured with:

```json
{
  "coverageReporters": ["json-summary"]
}
```

Or in `jest.config.js`:

```js
module.exports = {
  coverageReporters: ["json-summary", "text"],
};
```

---

## Get Notified

Watch the [nolapse changelog](/reference/changelog/) for the Node.js runner release. Once available, this tutorial will be updated with full working commands and example output.

---

## See Also

- [Multi-Language Projects](/how-to/multi-language/) — run Go and Python components alongside Node.js once it ships
- [Tutorial: Go Microservice](/tutorials/go-microservice/) — a fully working tutorial available today
- [Tutorial: Python Django App](/tutorials/python-django/) — a fully working tutorial available today
