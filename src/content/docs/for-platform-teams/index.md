---
title: For Platform and DevOps Teams
description: Start here if you own CI for several repositories. What nolapse gives you today, in the order you will need it.
---

This page is a route through the docs for the people who own CI and engineering standards across many repositories. It links the existing guides in the order a platform or DevOps team usually needs them, and it is explicit about what nolapse does today and what is still planned.

---

## What you get today

| You need | What nolapse does | Where to read |
| --- | --- | --- |
| A merge gate for coverage | `nolapse run` exits `1` when coverage regresses past the fail threshold, so branch protection can require the check. | [Block PRs on Coverage Regression](/how-to/pr-gate/), [Exit Codes](/reference/exit-codes/) |
| It in the CI you already run | A native GitHub Action. GitLab CI, Jenkins and Bitbucket Pipelines run `nolapse run` and read its exit code. | [GitHub Actions](/ci/github-actions/), [GitLab CI](/ci/gitlab-ci/), [Jenkins](/ci/jenkins/), [Bitbucket](/ci/bitbucket/) |
| A baseline that does not drift | The baseline is committed in each repository and every PR is compared to it. | [First Baseline](/first-baseline/), [Raise Threshold](/how-to/raise-threshold/) |
| Credentials per pipeline | Create a token for each pipeline, rotate it and revoke it. | [Token Setup](/tokens/setup/), [Rotation](/tokens/rotation/) |
| Monorepos and mixed stacks | Per component baselines and thresholds, and runners for Go, Python, Node.js, Java and .NET. | [Monorepo Setup](/how-to/monorepo/), [Multi-Language Repo](/how-to/multi-language/) |
| Your own runners | Install nolapse on self-hosted runners, including air-gapped ones. | [Self-Hosted Runner](/how-to/self-hosted-runner/) |
| Output your scripts can parse | `nolapse run` prints a key-value summary line with the outcome, delta, coverage and baseline. | [JSON Output](/reference/json-output/) |

---

## Your first enforced PR

1. [Install nolapse](/install/) on one runner or in one workflow.
2. Run `nolapse init` in a pilot repository and commit the generated baseline ([First Baseline](/first-baseline/)).
3. [Create a token](/tokens/setup/) and store it in your CI secrets.
4. Add the workflow from [Block PRs on Coverage Regression](/how-to/pr-gate/).
5. Require the check in branch protection, then open a PR that lowers coverage and confirm it is blocked ([First Enforcement](/first-enforcement/)).

The [Quickstart](/quickstart/) does the same path for a single repository in under 30 minutes.

---

## Rolling out to more repositories

Repeat the steps above per repository today. There is no organisation wide discovery or central policy yet, so keep these in one shared place:

- one workflow file or reusable workflow that your repositories copy
- one `nolapse.yaml` convention for thresholds ([Thresholds](/config/thresholds/), [Exclusions](/config/exclusions/))
- one naming scheme for tokens, such as one per pipeline

---

## Not available yet

These are on the roadmap and are not in the current release. Each linked page says what to do in the meantime.

- Native GitLab, Jenkins and Bitbucket integrations (the pages above use `nolapse run`)
- A dedicated `--output json` flag ([JSON Output](/reference/json-output/))
- Baseline locking ([Lock](/baseline/lock/)) and `--dry-run` ([Dry Run](/config/dry-run/))
- Finer grained token scopes ([Known Limitations](/reference/known-limitations/))

---

## Related

- [Troubleshooting](/troubleshooting/)
- [nolapse doctor](/doctor/)
- [Known Limitations](/reference/known-limitations/)
