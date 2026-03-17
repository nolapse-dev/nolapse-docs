---
title: "Dry Run"
description: The --dry-run flag is a planned P1 feature. This page covers the planned behaviour and current workarounds.
---

:::caution[Not yet available]
The `--dry-run` flag is a **planned P1 feature** and is not available in the current release. This page documents the planned behaviour and a practical workaround you can use today.
:::

## Planned behaviour

When `--dry-run` ships, passing it to `nolapse run` will:

1. Run coverage collection as normal.
2. Compute the delta against the baseline.
3. Print the outcome (pass / warn / fail) and the delta to stdout.
4. **Not** write any files (no `.nolapse_run_state` update).
5. **Always exit 0**, regardless of whether the result would normally be a warn or fail.

This makes it safe to call in exploratory or debug contexts without affecting CI exit codes or state files.

```bash
# Planned — not yet supported
nolapse run --dry-run
```

Expected output (illustrative):

```text
[dry-run] current coverage: 81.20%
[dry-run] baseline:         82.00%
[dry-run] delta:            -0.80pp
[dry-run] outcome:          WARN (would exit 0 normally, exit 1 in strict mode)
[dry-run] no files written.
```

## Current workaround

Until `--dry-run` is available, you can simulate the behaviour by temporarily setting a very high `--fail-threshold` so that nolapse never exits non-zero:

```bash
nolapse run --warn-threshold 999 --fail-threshold 999
```

This will:

- Run coverage collection normally.
- Always produce a pass result regardless of the actual delta.
- Still write `.nolapse_run_state`, so do not follow this with `nolapse baseline update` unless you intend to commit the result.

To observe what the outcome *would have been* under your normal thresholds, read the `.nolapse_run_state` file after the run:

```bash
cat .nolapse_run_state
# {"coverage": 81.20, "head_sha": "abc123..."}
```

Then compare manually to the baseline in `.audit/coverage/baseline.md`:

```bash
cat .audit/coverage/baseline.md
# coverage: 82.00%
# timestamp: 2026-01-01T10:00:00Z
# commit: def456...
```

The difference (`81.20 - 82.00 = -0.80 pp`) tells you what result your configured thresholds would produce.

## Tracking the feature

The `--dry-run` flag is tracked as a P1 item on the nolapse roadmap. When it ships, this page will be updated with the full flag reference.
