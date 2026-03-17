---
title: Jenkins
description: How to run nolapse in Jenkins pipelines using a Jenkinsfile and exit code handling.
---

nolapse does not yet have a native Jenkins plugin. You can invoke `nolapse run` directly from a `Jenkinsfile` and use the exit code to control stage success or failure. A native plugin is planned for a future release.

## Prerequisites

- The Jenkins agent must have Go 1.22+ available (to install the nolapse CLI via `go install`), or nolapse must be pre-installed on the agent image.
- Store your nolapse token as a Jenkins **Secret Text** credential named `NOLAPSE_TOKEN`.

## Declarative pipeline

```groovy
pipeline {
    agent { label 'go-agent' }

    environment {
        NOLAPSE_TOKEN = credentials('NOLAPSE_TOKEN')
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Install nolapse') {
            steps {
                sh 'go install github.com/nolapse/nolapse-cli/nolapse-cli/cmd/nolapse@latest'
            }
        }

        stage('Test') {
            steps {
                sh 'go test ./...'
            }
        }

        stage('Coverage check') {
            steps {
                sh 'nolapse run --repo .'
            }
        }
    }

    post {
        failure {
            echo 'Coverage threshold breached or nolapse run failed.'
        }
    }
}
```

`nolapse run` exits `1` when the fail threshold is breached. Jenkins treats a non-zero exit code as a stage failure, which marks the build as **FAILED**.

## Scripted pipeline

```groovy
node('go-agent') {
    withCredentials([string(credentialsId: 'NOLAPSE_TOKEN', variable: 'NOLAPSE_TOKEN')]) {
        stage('Checkout') {
            checkout scm
        }

        stage('Install nolapse') {
            sh 'go install github.com/nolapse/nolapse-cli/nolapse-cli/cmd/nolapse@latest'
        }

        stage('Coverage check') {
            def rc = sh(script: 'nolapse run --repo .', returnStatus: true)
            if (rc == 1) {
                // Warn but do not fail the build during rollout
                unstable('Coverage threshold breached — see nolapse output')
            } else if (rc != 0) {
                error("nolapse run failed with exit code ${rc}")
            }
        }
    }
}
```

Using `returnStatus: true` captures the exit code without immediately failing the step. `unstable()` marks the build **UNSTABLE** (yellow) rather than **FAILED** (red), which is useful during initial rollout when you want visibility without blocking deployments.

## Python projects

For Python projects, the agent needs Python 3 and `pytest`/`pytest-cov` in addition to Go:

```groovy
stage('Coverage check') {
    steps {
        sh '''
            pip install --quiet pytest pytest-cov
            nolapse run --repo . --lang python
        '''
    }
}
```

Or set `lang: python` in `nolapse.yaml` and omit `--lang python` from the command.

## Using a pre-installed nolapse binary

To avoid downloading the CLI on every build, install nolapse on the agent image during provisioning:

```bash
go install github.com/nolapse/nolapse-cli/nolapse-cli/cmd/nolapse@latest
cp "$(go env GOPATH)/bin/nolapse" /usr/local/bin/nolapse
```

Then remove the `Install nolapse` stage from your `Jenkinsfile`.

## Planned native plugin

A Jenkins plugin will add:

- Build trend charts showing coverage delta over time.
- Per-build annotations with pass/warn/fail status.
- Integration with the Jenkins Test Results Analyser.

Until the plugin is available, the exit code and stdout parsing are the primary integration points.
