---
title: Node.js
description: Node.js support is planned for a future release. This page describes what to expect and how to work around the gap today.
---

:::caution[Planned — not yet available]
Node.js is on the nolapse roadmap as a P1 language. The built-in runner does not exist yet. The workaround below lets you use nolapse with Node.js projects today via the custom runner mechanism.
:::

## What is planned

When the built-in Node.js runner ships, it will:

- Accept `lang: nodejs` in `nolapse.yaml`.
- Invoke `jest --coverage --coverageReporters=json-summary` (or `c8`/`v8` for non-Jest projects) automatically.
- Parse `coverage-summary.json` to extract the total statement coverage percentage.
- Respect the same `warn_threshold` / `fail_threshold` / `strict_mode` settings as all other runners.

The expected `nolapse.yaml` when it is available:

```yaml
lang: nodejs
warn_threshold: -1.0
fail_threshold: -5.0
strict_mode: false
```

## Workaround: custom runner

Until the built-in runner ships you can drive Jest coverage yourself and feed the result to nolapse via a custom runner script.

### 1. Generate a coverage summary

Add a script to `package.json`:

```json
{
  "scripts": {
    "test:coverage": "jest --coverage --coverageReporters=json-summary --coverageDirectory=coverage"
  }
}
```

### 2. Write a custom runner script

Create `nolapse-runner.sh` at the repo root:

```bash
#!/usr/bin/env bash
set -euo pipefail

REPO_PATH="${1:-.}"
cd "$REPO_PATH"

npm test -- --coverage --coverageReporters=json-summary --coverageDirectory=coverage 2>/dev/null

PCT=$(node -e "
  const s = require('./coverage/coverage-summary.json');
  console.log(s.total.statements.pct);
")

echo "nolapse-coverage: ${PCT}"
```

Make it executable:

```bash
chmod +x nolapse-runner.sh
```

### 3. Configure nolapse

```yaml
lang: custom
warn_threshold: -1.0
fail_threshold: -5.0
```

Point nolapse at the script:

```bash
NOLAPSE_RUNNER_PATH=./nolapse-runner.sh nolapse run --repo .
```

See [Custom Runner](/languages/custom/) for full details on the runner contract and the output format nolapse expects.

## Track the roadmap

Watch the nolapse changelog and the [Node.js runner issue](https://github.com/nolapse-dev/nolapse-platform/issues) for updates. When the built-in runner lands, you can remove the custom script and switch to `lang: nodejs`.
