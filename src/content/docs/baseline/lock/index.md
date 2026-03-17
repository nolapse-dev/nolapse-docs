---
title: "Baseline Lock"
description: Baseline locking is a planned P1 feature. This page covers the concept and current workarounds using branch protection.
---

:::caution[Not yet available]
Baseline locking is a **planned P1 feature** and is not available in the current release. This page explains the concept and describes the workaround available today.
:::

## What baseline locking is

Baseline locking prevents `nolapse baseline update` from running without an explicit, deliberate review step. Without locking, anyone with write access to the repository can run `nolapse baseline update` and commit a new baseline — potentially masking a coverage regression that was accepted too casually.

A lock mechanism adds a gate: before the baseline can be advanced, the change must pass through a defined review process (e.g., a PR approval, a specific CI job, or a sign-off from a code owner).

## Planned behaviour

When baseline locking ships, the feature is expected to work roughly as follows:

- A `locked: true` flag (or similar) in `nolapse.yaml` or a separate `.audit/coverage/lock` file marks the baseline as locked.
- `nolapse baseline update` will refuse to proceed unless the lock is explicitly released or the caller presents an authorisation token.
- An unlock command or a dashboard action will be required before an update can go through.

The exact interface is not finalised. This page will be updated when the feature is implemented.

## Current workaround: branch protection

The most effective workaround today is to treat `.audit/coverage/baseline.md` as a protected file using your git host's branch protection rules.

### GitHub

1. Require pull requests before merging to `main`. This means `nolapse baseline update`'s git commit cannot land on `main` directly — it must go through a PR.
2. Add a **CODEOWNERS** entry for the baseline file so that baseline updates require approval from a designated owner:

   ```text
   # .github/CODEOWNERS
   .audit/coverage/baseline.md   @your-org/platform-team
   ```

3. Enable **"Require review from Code Owners"** in the branch protection settings for `main`.

With this setup, any commit that touches `baseline.md` — including those produced by `nolapse baseline update` — requires an explicit approval from the platform team before it can merge.

### GitLab

Use **protected branches** combined with a `CODEOWNERS` file (GitLab Premium) or a required approval rule scoped to the `.audit/` path. Alternatively, use a merge request approval rule that triggers whenever `baseline.md` is modified.

### General principle

Regardless of git host, the principle is the same:

- Run `nolapse baseline update` on a branch, not directly on `main`.
- Open a PR for the baseline update commit.
- Require at least one approval before merging.
- Use code owners or approval rules to ensure the right people review baseline changes.

This gives you an auditable, reviewable baseline update process without needing the locking feature to ship.

## Why this matters

Unreviewed baseline updates are a common way that coverage enforcement silently degrades over time. A team notices a failing CI check, runs `nolapse baseline update` to "fix" it, and moves on — without recognising that they have just lowered the floor. The audit log (`nolapse audit list`) will show the change, but only if someone thinks to look.

Requiring a PR for every baseline update makes the tradeoff visible and deliberate. Combined with the audit log, it gives teams a clear, reviewable history of every time the coverage floor was moved.
