---
title: Bitbucket Pipelines
description: How to run nolapse in Bitbucket Pipelines using bitbucket-pipelines.yml and exit code handling.
---

nolapse does not yet have a native Bitbucket integration. You can invoke `nolapse run` directly in a Bitbucket Pipelines step and use the exit code to control pipeline success or failure.

## Prerequisites

- Store your nolapse token as a **Repository variable** (or Workspace/Deployment variable) named `NOLAPSE_TOKEN` in the Bitbucket repository settings. Mark it as secured.

## Basic pipeline (Go project)

```yaml
image: golang:1.22

pipelines:
  pull-requests:
    '**':
      - step:
          name: Coverage check
          caches:
            - gopath
          script:
            - go install github.com/nolapse/nolapse-cli/nolapse-cli/cmd/nolapse@latest
            - nolapse run --repo .
```

nolapse reads `nolapse.yaml` from the repository root for language, warn threshold, and fail threshold settings. The step fails automatically if `nolapse run` exits `1`.

## Python project

```yaml
image: python:3.12

pipelines:
  pull-requests:
    '**':
      - step:
          name: Coverage check
          script:
            - pip install pytest pytest-cov
            - apt-get update -qq && apt-get install -y -qq golang-go
            - go install github.com/nolapse/nolapse-cli/nolapse-cli/cmd/nolapse@latest
            - nolapse run --repo . --lang python
```

To avoid installing Go on a Python image in every run, consider building a custom Docker image with both runtimes pre-installed and referencing it with `image:`.

## Continuing the pipeline on threshold breach

By default, a non-zero exit terminates the pipeline. To allow subsequent steps to run even when nolapse warns:

```yaml
pipelines:
  pull-requests:
    '**':
      - step:
          name: Coverage check
          script:
            - go install github.com/nolapse/nolapse-cli/nolapse-cli/cmd/nolapse@latest
            - nolapse run --repo . || echo "Coverage threshold breached — review delta"
```

Using `|| echo ...` prevents the non-zero exit from failing the step. This is useful during initial rollout. Remove it once you want hard enforcement.

## Parallel step with test suite

If you run `go test` separately in your pipeline, you can split the steps to keep concerns separate:

```yaml
image: golang:1.22

pipelines:
  pull-requests:
    '**':
      - parallel:
          - step:
              name: Unit tests
              script:
                - go test ./...
          - step:
              name: Coverage enforcement
              script:
                - go install github.com/nolapse/nolapse-cli/nolapse-cli/cmd/nolapse@latest
                - nolapse run --repo .
```

Note that running tests twice (once in each parallel step) increases pipeline minutes. Prefer a sequential layout if build time is a concern.

## Passing the token securely

Bitbucket Pipelines injects repository variables automatically as environment variables. If nolapse requires the token to authenticate against the nolapse API, no extra configuration is needed beyond adding the variable in the repository settings — it will be available as `$NOLAPSE_TOKEN` in every step.

For workspace-level sharing, add `NOLAPSE_TOKEN` as a Workspace variable so all repositories in the workspace inherit it without per-repo configuration.
