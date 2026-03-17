---
title: "Updating the Baseline"
description: When and how to run nolapse baseline update to advance the recorded coverage baseline.
---

`nolapse baseline update` advances the stored baseline to match the current coverage measurement. Run it after a PR that intentionally improves coverage and you want future runs to compare against the new, higher number rather than the old one.

## When to update the baseline

Update the baseline when:

- A PR adds new tests and coverage increases deliberately.
- You want to lock in a coverage improvement so regressions are measured from the new level.
- A refactor removes dead code and coverage rises as a side effect, and you accept the new number as the floor.

Do **not** update the baseline to escape a failing `nolapse run`. The baseline is a floor, not a target — raising it to hide a regression defeats the purpose of enforcement.

## The two-step workflow

`nolapse baseline update` does not re-run coverage itself. It reads from the `.nolapse_run_state` file written by a preceding `nolapse run`. The workflow is always:

```bash
# Step 1 — run coverage and produce run state
nolapse run --repo .

# Step 2 — advance the baseline using that run state
nolapse baseline update --repo .
```

These two commands must be run in order. If you run `nolapse baseline update` without a prior `nolapse run` in the same repo, it will fail.

## What `nolapse baseline update` does

1. **Reads `.nolapse_run_state`** — a JSON file written by `nolapse run`. Example contents:

   ```json
   {"coverage": 84.10, "head_sha": "a3f8c21d4e6b09f1c2d3e4f5a6b7c8d9e0f1a2b3"}
   ```

2. **Appends a new entry to `.audit/coverage/baseline.md`** in the append-only log format:

   ```text
   2026-03-01T14:22:05Z | 84.10% | a3f8c21d4e6b09f1c2d3e4f5a6b7c8d9e0f1a2b3
   ```

3. **Updates the header block** in `baseline.md` so the `coverage:` and `commit:` fields reflect the new baseline.

4. **Creates a git commit** with the updated `baseline.md`.

## The `.nolapse_run_state` dependency

`.nolapse_run_state` is a transient file. It lives at the repo root and is overwritten on every `nolapse run`. Its schema is:

```json
{"coverage": 84.10, "head_sha": "<40-char-sha>"}
```

:::caution[Do not commit .nolapse_run_state]
Add `.nolapse_run_state` to your `.gitignore`. It is consumed by `nolapse baseline update` and should not be stored in version history.
:::

```bash
# .gitignore
.nolapse_run_state
```

## Running without a prior `nolapse run`

If `.nolapse_run_state` does not exist when you call `nolapse baseline update`, the command fails:

```text
error: .nolapse_run_state not found
       run `nolapse run` first to generate coverage state
```

Always run `nolapse run` immediately before `nolapse baseline update` in the same pipeline step or shell session.

## Git history format

`nolapse baseline update` makes one git commit. The commit touches only `.audit/coverage/baseline.md`. Over time, this produces a clean, auditable history of baseline changes:

```text
a1b2c3d  chore(nolapse): update baseline to 84.10% [2026-03-01]
9f8e7d6  chore(nolapse): update baseline to 83.40% [2026-02-14]
5c4b3a2  chore(nolapse): update baseline to 82.50% [2026-01-15]
```

You can inspect this history with [`nolapse audit list`](/baseline/audit-list/) or directly with `git log -- .audit/coverage/baseline.md`.

## Usage

```bash
# Update baseline in the current directory
nolapse baseline update

# Update baseline in a specific repo
nolapse baseline update --repo /path/to/my-service
```

## Recommended CI pattern

In most setups, `nolapse baseline update` is run manually or in a dedicated post-merge job — not in the PR check itself. A typical setup:

1. **PR check job** — runs `nolapse run`. Fails if coverage regresses past thresholds.
2. **Post-merge job** (on `main`) — runs `nolapse run` then `nolapse baseline update` after the PR is merged and coverage is confirmed.

This ensures the baseline only advances after code has landed on the main branch, not speculatively during review.
