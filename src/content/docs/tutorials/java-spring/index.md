---
title: "Tutorial: Java Spring Boot API"
description: Preview of the planned Java tutorial — Spring Boot with JaCoCo coverage and a nolapse CI gate.
---

:::caution[Language support planned]
Java (`--lang java`) is not yet available. This page previews what the tutorial will cover once the runner ships. No commands on this page will work until Java support is released.
:::

---

## What This Tutorial Will Cover

When Java support lands, this tutorial will walk through:

1. Creating a minimal Spring Boot REST API with `GET /health` and `GET /greet` endpoints
2. Writing JUnit 5 tests and configuring JaCoCo to produce an XML coverage report
3. Running `nolapse init --repo . --lang java` to create the baseline from the JaCoCo report
4. Simulating a coverage regression by removing a test method
5. Running `nolapse run --repo . --lang java` and seeing it exit 1
6. Adding a GitHub Actions workflow with Maven or Gradle that gates PRs on coverage

---

## Expected Project Structure

```text
hello-spring/
├── src/
│   ├── main/java/com/example/hello/
│   │   ├── HelloController.java
│   │   └── HelloApplication.java
│   └── test/java/com/example/hello/
│       └── HelloControllerTest.java
├── pom.xml
├── .audit/
│   └── coverage/
│       └── baseline.md
└── nolapse.yaml
```

---

## Expected Commands (Once Available)

### Build and test with Maven

```bash
mvn verify
```

JaCoCo generates `target/site/jacoco/jacoco.xml`. nolapse will read this file.

### Initialise

```bash
nolapse init --repo . --lang java
```

### Run a check

```bash
nolapse run --repo . --lang java
```

### GitHub Actions workflow (Maven)

```yaml
name: Coverage check

on:
  pull_request:

jobs:
  coverage:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Set up Java
        uses: actions/setup-java@v4
        with:
          java-version: "21"
          distribution: temurin

      - name: Build and test
        run: mvn verify

      - name: Run nolapse
        uses: nolapse/nolapse-action@v1
        with:
          repo-token: ${{ secrets.GITHUB_TOKEN }}
          lang: java
          warn-threshold: "0.5"
          fail-threshold: "1.0"
```

---

## JaCoCo Configuration

nolapse will read the JaCoCo XML report. Add the JaCoCo plugin to `pom.xml`:

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
      <phase>verify</phase>
      <goals><goal>report</goal></goals>
    </execution>
  </executions>
</plugin>
```

---

## Get Notified

Watch the [nolapse changelog](/reference/changelog/) for the Java runner release. Once available, this tutorial will be updated with full working commands and example output.

---

## See Also

- [Tutorial: Go Microservice](/tutorials/go-microservice/) — a fully working tutorial available today
- [Tutorial: Python Django App](/tutorials/python-django/) — a fully working tutorial available today
- [Multi-Language Projects](/how-to/multi-language/) — run multiple language components side by side
