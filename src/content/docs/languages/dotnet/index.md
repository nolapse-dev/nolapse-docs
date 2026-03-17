---
title: .NET
description: .NET support is planned for a future release. This page describes what to expect and how to work around the gap today.
---

:::caution[Planned — not yet available]
.NET is on the nolapse roadmap. The built-in runner does not exist yet. The workaround below lets you use nolapse with .NET projects today via the custom runner mechanism.
:::

## What is planned

When the built-in .NET runner ships, it will:

- Accept `lang: dotnet` in `nolapse.yaml`.
- Invoke `dotnet test --collect:"XPlat Code Coverage"` automatically.
- Parse the Cobertura XML report produced by Coverlet to extract line coverage.
- Respect the same `warn_threshold` / `fail_threshold` / `strict_mode` settings as all other runners.

The expected `nolapse.yaml` when it is available:

```yaml
lang: dotnet
warn_threshold: -1.0
fail_threshold: -5.0
strict_mode: false
```

## Workaround: custom runner (Coverlet)

Until the built-in runner ships you can invoke `dotnet test` with Coverlet and parse the resulting JSON summary.

### 1. Add Coverlet to your test project

```bash
dotnet add package coverlet.collector
```

Or for MSBuild integration:

```bash
dotnet add package coverlet.msbuild
```

### 2. Write a custom runner script

Create `nolapse-runner.sh` at the repo root:

```bash
#!/usr/bin/env bash
set -euo pipefail

REPO_PATH="${1:-.}"
cd "$REPO_PATH"

# Run tests and produce a JSON summary via coverlet
dotnet test --collect:"XPlat Code Coverage" \
  -- DataCollectionRunSettings.DataCollectors.DataCollector.Configuration.Format=json \
     DataCollectionRunSettings.DataCollectors.DataCollector.Configuration.OutputFormat=json

# Find the most recently written coverage.json
COVERAGE_FILE=$(find . -name "coverage.json" -newer nolapse.yaml 2>/dev/null | head -1)

if [ -z "$COVERAGE_FILE" ]; then
  echo "nolapse-runner: coverage.json not found" >&2
  exit 1
fi

PCT=$(python3 -c "
import json, sys
data = json.load(open('$COVERAGE_FILE'))
lines_covered = sum(v.get('Summary', {}).get('LinesCovered', 0) for v in data.values())
lines_total   = sum(v.get('Summary', {}).get('LinesTotal', 0)   for v in data.values())
print(f'{(lines_covered / lines_total * 100):.1f}' if lines_total else '0.0')
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

Run nolapse:

```bash
NOLAPSE_RUNNER_PATH=./nolapse-runner.sh nolapse run --repo .
```

See [Custom Runner](/languages/custom/) for the full runner contract.

## Track the roadmap

Watch the nolapse changelog and the [.NET runner issue](https://github.com/nolapse-dev/nolapse-platform/issues) for updates.
