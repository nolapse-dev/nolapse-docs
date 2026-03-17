---
title: Java
description: Java support is planned for a future release. This page describes what to expect and how to work around the gap today.
---

:::caution[Planned — not yet available]
Java is on the nolapse roadmap. The built-in runner does not exist yet. The workaround below lets you use nolapse with Java projects today via the custom runner mechanism.
:::

## What is planned

When the built-in Java runner ships, it will:

- Accept `lang: java` in `nolapse.yaml`.
- Support both **Maven** (`mvn test`) and **Gradle** (`./gradlew test`) build systems automatically.
- Parse JaCoCo XML or CSV reports to extract overall instruction or line coverage.
- Respect the same `warn_threshold` / `fail_threshold` / `strict_mode` settings as all other runners.

The expected `nolapse.yaml` when it is available:

```yaml
lang: java
warn_threshold: -1.0
fail_threshold: -5.0
strict_mode: false
```

## Workaround: custom runner (Maven + JaCoCo)

Until the built-in runner ships you can parse JaCoCo output yourself and emit the result in the format nolapse expects.

### 1. Add the JaCoCo plugin

In your `pom.xml`:

```xml
<plugin>
  <groupId>org.jacoco</groupId>
  <artifactId>jacoco-maven-plugin</artifactId>
  <version>0.8.11</version>
  <executions>
    <execution>
      <goals><goal>prepare-agent</goal></goals>
    </execution>
    <execution>
      <id>report</id>
      <phase>test</phase>
      <goals><goal>report</goal></goals>
    </execution>
  </executions>
</plugin>
```

### 2. Write a custom runner script

Create `nolapse-runner.sh` at the repo root:

```bash
#!/usr/bin/env bash
set -euo pipefail

REPO_PATH="${1:-.}"
cd "$REPO_PATH"

mvn -q test

# Parse JaCoCo CSV: covered / (covered + missed) for INSTRUCTION
CSV="target/site/jacoco/jacoco.csv"
PCT=$(tail -n +2 "$CSV" | awk -F',' '
  { covered += $5; missed += $4 }
  END { printf "%.1f", (covered / (covered + missed)) * 100 }
')

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

## Workaround: Gradle + JaCoCo

For Gradle projects, replace the Maven step in the runner script with:

```bash
./gradlew test jacocoTestReport
CSV="build/reports/jacoco/test/jacocoTestReport.csv"
```

The CSV parsing awk expression is the same.

## Track the roadmap

Watch the nolapse changelog and the [Java runner issue](https://github.com/nolapse-dev/nolapse-platform/issues) for updates.
