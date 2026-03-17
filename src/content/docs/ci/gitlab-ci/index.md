---
title: GitLab CI
description: How to run nolapse in GitLab CI pipelines using nolapse run and exit code handling.
---

nolapse does not yet have a native GitLab integration (MR status checks and inline MR comments are on the roadmap). In the meantime you can use `nolapse run` directly in a `.gitlab-ci.yml` job. nolapse exits `1` when the fail threshold is breached, which GitLab uses to mark the pipeline stage as failed.

## Basic setup

### 1. Add the nolapse token to CI variables

In **Settings → CI/CD → Variables**, add:

- `NOLAPSE_TOKEN` — your nolapse API token (mark it as masked and protected).

### 2. Add a coverage job to `.gitlab-ci.yml`

```yaml
stages:
  - test
  - coverage

coverage:
  stage: coverage
  image: golang:1.22
  before_script:
    - go install github.com/nolapse/nolapse-cli/nolapse-cli/cmd/nolapse@latest
  script:
    - nolapse run --repo .
  variables:
    NOLAPSE_TOKEN: $NOLAPSE_TOKEN
  rules:
    - if: '$CI_PIPELINE_SOURCE == "merge_request_event"'
```

nolapse reads `nolapse.yaml` from the repo root for language and threshold settings.

## Python project

```yaml
coverage:
  stage: coverage
  image: python:3.12
  before_script:
    - pip install pytest pytest-cov
    - apt-get update -qq && apt-get install -y -qq golang-go
    - go install github.com/nolapse/nolapse-cli/nolapse-cli/cmd/nolapse@latest
  script:
    - nolapse run --repo . --lang python
  variables:
    NOLAPSE_TOKEN: $NOLAPSE_TOKEN
  rules:
    - if: '$CI_PIPELINE_SOURCE == "merge_request_event"'
```

Alternatively, build a custom Docker image that has both Go and Python pre-installed to avoid the `apt-get` step in every CI run.

## Controlling failure behaviour

By default, if `nolapse run` exits `1` the GitLab job fails and the pipeline is blocked. If you want the pipeline to continue but still surface a failure signal, use `allow_failure`:

```yaml
coverage:
  stage: coverage
  image: golang:1.22
  before_script:
    - go install github.com/nolapse/nolapse-cli/nolapse-cli/cmd/nolapse@latest
  script:
    - nolapse run --repo .
  allow_failure:
    exit_codes: 1
  rules:
    - if: '$CI_PIPELINE_SOURCE == "merge_request_event"'
```

With `allow_failure.exit_codes: 1`, the job is marked as a warning (yellow) rather than an error (red), and the pipeline as a whole is not blocked. This is useful during initial rollout when you want visibility without blocking merges.

## Storing the exit code for downstream steps

If you need to react to the nolapse result in a later step within the same job:

```yaml
script:
  - nolapse run --repo . || NOLAPSE_EXIT=$?
  - echo "nolapse exited with $NOLAPSE_EXIT"
  - if [ "${NOLAPSE_EXIT:-0}" -eq 1 ]; then echo "Coverage threshold breached"; fi
  - exit "${NOLAPSE_EXIT:-0}"
```

## Planned GitLab integration

Native GitLab integration will add:

- Automatic MR status check posting (pass/warn/fail annotation on the MR).
- Inline MR comments with coverage delta and per-file breakdown.
- Pipeline badge support.

Until that ships, the job exit code is the primary signal. You can parse nolapse stdout and use the [GitLab Code Coverage regex feature](https://docs.gitlab.com/ee/ci/testing/code_coverage.html) to surface the percentage in the pipeline UI:

```yaml
coverage:
  stage: coverage
  image: golang:1.22
  before_script:
    - go install github.com/nolapse/nolapse-cli/nolapse-cli/cmd/nolapse@latest
  script:
    - nolapse run --repo .
  coverage: '/nolapse: mean coverage: (\d+\.\d+)%/'
```

GitLab will capture that regex match and display the coverage percentage on the pipeline and MR pages.
