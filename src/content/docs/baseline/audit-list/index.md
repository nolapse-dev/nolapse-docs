---
title: "Audit Log"
description: How to use nolapse audit list to view the history of baseline changes and diagnose coverage trends.
---

`nolapse audit list` displays the last 10 entries from the baseline change history — a table showing when the baseline was updated, by whom, and to what coverage value.

## Usage

```bash
# Audit the current directory's repo
nolapse audit list

# Audit a specific repo
nolapse audit list --repo /path/to/my-service
```

## Output format

The command prints a table with four columns:

```text
Commit   | Timestamp            | Author              | Coverage
---------|----------------------|---------------------|----------
a1b2c3d  | 2026-03-01T14:22:05Z | alice@example.com   | 84.10%
9f8e7d6  | 2026-02-14T10:05:33Z | bob@example.com     | 83.40%
5c4b3a2  | 2026-01-15T09:32:11Z | alice@example.com   | 82.50%
```

| Column     | Description                                                    |
| ---------- | -------------------------------------------------------------- |
| `Commit`   | The short SHA of the git commit that updated the baseline      |
| `Timestamp`| The ISO 8601 UTC time when the baseline was updated            |
| `Author`   | The git author of the baseline update commit                   |
| `Coverage` | The coverage percentage recorded at that baseline update       |

The most recent entry is shown first. Up to 10 entries are shown; older entries remain in `baseline.md` but are not displayed by default.

## How it works

`nolapse audit list` reads the append-only log section of `.audit/coverage/baseline.md` and cross-references each recorded SHA with `git log` to retrieve the commit author. It does not make any network calls and works entirely from local git history.

The underlying data comes from lines appended by `nolapse baseline update`:

```text
2026-03-01T14:22:05Z | 84.10% | a3f8c21d4e6b09f1c2d3e4f5a6b7c8d9e0f1a2b3
2026-02-14T10:05:33Z | 83.40% | 9f8e7d6c5b4a3f2e1d0c9b8a7f6e5d4c3b2a1f0
2026-01-15T09:32:11Z | 82.50% | 5c4b3a2f1e0d9c8b7a6f5e4d3c2b1a0f9e8d7c6
```

## Use case: diagnosing a coverage decline

If `nolapse run` starts warning or failing in CI, `nolapse audit list` helps answer: *was this a sudden drop, or a gradual slide?*

A sudden drop from one entry to the next suggests a specific PR removed tests or added uncovered code. A slow decline over multiple entries suggests test discipline has been eroding over time.

For example, this output shows a project that had been improving but recently slipped:

```text
Commit   | Timestamp            | Author              | Coverage
---------|----------------------|---------------------|----------
d4e5f6a  | 2026-03-15T08:11:20Z | carol@example.com   | 79.30%
a1b2c3d  | 2026-03-01T14:22:05Z | alice@example.com   | 84.10%
9f8e7d6  | 2026-02-14T10:05:33Z | bob@example.com     | 83.40%
```

The jump from 84.10% to 79.30% in two weeks points to a specific window to investigate with `git log`.

## Viewing full history

The full baseline history is always available by reading `.audit/coverage/baseline.md` directly or using git:

```bash
# All commits that touched the baseline file
git log --oneline -- .audit/coverage/baseline.md

# Full diff history
git log -p -- .audit/coverage/baseline.md
```
