---
title: Custom Runner
description: Implement the nolapse runner contract to add coverage enforcement for any language or build system.
---

The custom runner mechanism lets you plug any language, test framework, or coverage tool into nolapse. You write a script that measures coverage and prints one structured line to stdout. nolapse handles the rest — baseline comparison, threshold enforcement, CI reporting.

## The runner contract

A nolapse runner is any executable that satisfies these rules:

1. **Invocation.** nolapse calls it as: `python3 <script> <repo_path>` for Python, or directly as `<script> <repo_path>` for shell/binary runners. The first (and only) positional argument is the absolute path to the repository root.
2. **Output.** The runner must print the following line to **stdout** at some point during execution:

   ```text
   nolapse-coverage: <number>
   ```

   where `<number>` is the coverage percentage as a decimal, e.g. `73.4` or `100.0`. Any other stdout output is ignored. Stderr is forwarded to the nolapse log.

3. **Exit codes.** Exit `0` if coverage was measured successfully. Exit `1` (or any non-zero) if measurement failed. nolapse will surface the failure and abort without comparing to a baseline.

4. **Timeout.** Runners are not given an infinite window. Keep execution under the timeout of whichever built-in runner your `lang` setting maps to. For `lang: custom` the timeout is 10 minutes.

## Telling nolapse to use your runner

Set `NOLAPSE_RUNNER_PATH` to the absolute path of your runner script before invoking nolapse:

```bash
export NOLAPSE_RUNNER_PATH=/path/to/my-runner.sh
nolapse run --repo .
```

You can also set it inline:

```bash
NOLAPSE_RUNNER_PATH=./nolapse-runner.sh nolapse run --repo .
```

In `nolapse.yaml`, set `lang: custom` so nolapse knows to delegate entirely to the external script rather than using any built-in logic:

```yaml
lang: custom
warn_threshold: -1.0
fail_threshold: -5.0
strict_mode: false
```

## Minimal shell example

The following script is a complete, working custom runner for a hypothetical `make coverage` target that writes a `coverage-report.txt` file containing a line like `Total: 76.3%`.

```bash
#!/usr/bin/env bash
set -euo pipefail

REPO_PATH="${1:-.}"
cd "$REPO_PATH"

# Run your test suite and generate coverage output
make coverage 2>/dev/null

# Extract the percentage from whatever format your tool produces
PCT=$(grep -oP 'Total:\s+\K[\d.]+' coverage-report.txt)

if [ -z "$PCT" ]; then
  echo "custom-runner: could not parse coverage percentage" >&2
  exit 1
fi

# Emit the required summary line
echo "nolapse-coverage: ${PCT}"
```

Save it, make it executable (`chmod +x nolapse-runner.sh`), then:

```bash
NOLAPSE_RUNNER_PATH=./nolapse-runner.sh nolapse run --repo .
```

## Python runner example

```python
#!/usr/bin/env python3
"""Minimal nolapse custom runner — reads coverage from a JSON file."""

import json
import sys
from pathlib import Path

repo_path = Path(sys.argv[1]) if len(sys.argv) > 1 else Path(".")

coverage_file = repo_path / "coverage-output.json"
if not coverage_file.exists():
    print(f"custom-runner: {coverage_file} not found", file=sys.stderr)
    sys.exit(1)

data = json.loads(coverage_file.read_text())
pct = data["totals"]["percent_covered"]  # adjust key path for your tool

print(f"nolapse-coverage: {pct:.1f}")
```

## What nolapse does after receiving the output line

Once the runner exits 0 and the `nolapse-coverage:` line has been captured, nolapse:

1. Parses the percentage value.
2. Loads `nolapse-baseline.json` from the `--repo` directory.
3. Computes `delta = current - baseline`.
4. Applies threshold logic:
   - `delta > -warn_threshold` → **pass**
   - `delta > -fail_threshold` → **warn** (exit 0, warning message)
   - `delta ≤ -fail_threshold` → **fail** (exit 1)
5. If `strict_mode: true`, any negative delta fails regardless of thresholds.

## Using a custom runner for languages without built-in support

For languages that do not yet have a built-in nolapse runner (Node.js, Java, .NET), the custom runner is the recommended approach. See the per-language pages for ready-made examples:

- [Node.js workaround](/languages/nodejs/)
- [Java workaround](/languages/java/)
- [.NET workaround](/languages/dotnet/)
