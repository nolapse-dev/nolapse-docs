---
title: "Tutorial: .NET Web API"
description: Preview of the planned .NET tutorial — ASP.NET Core Web API with Coverlet coverage and a nolapse CI gate.
---

:::caution[Language support planned]
.NET (`--lang dotnet`) is not yet available. This page previews what the tutorial will cover once the runner ships. No commands on this page will work until .NET support is released.
:::

---

## What This Tutorial Will Cover

When .NET support lands, this tutorial will walk through:

1. Creating a minimal ASP.NET Core Web API with `GET /health` and `GET /greet` endpoints
2. Writing xUnit tests and configuring Coverlet to produce a `coverage.json` report
3. Running `nolapse init --repo . --lang dotnet` to create the baseline
4. Simulating a coverage regression by removing a test
5. Running `nolapse run --repo . --lang dotnet` and seeing it exit 1
6. Adding a GitHub Actions workflow that gates PRs on coverage

---

## Expected Project Structure

```text
hello-dotnet/
├── HelloApi/
│   ├── Controllers/
│   │   └── HelloController.cs
│   └── HelloApi.csproj
├── HelloApi.Tests/
│   ├── HelloControllerTests.cs
│   └── HelloApi.Tests.csproj
├── HelloApi.sln
├── .audit/
│   └── coverage/
│       └── baseline.md
└── nolapse.yaml
```

---

## Expected Commands (Once Available)

### Run tests with Coverlet

```bash
dotnet test --collect:"XPlat Code Coverage" --results-directory ./coverage
```

Coverlet generates `coverage/*/coverage.cobertura.xml`. nolapse will read this format.

### Initialise

```bash
nolapse init --repo . --lang dotnet
```

### Run a check

```bash
nolapse run --repo . --lang dotnet
```

### GitHub Actions workflow

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

      - name: Set up .NET
        uses: actions/setup-dotnet@v4
        with:
          dotnet-version: "8.0.x"

      - name: Restore and build
        run: dotnet build

      - name: Run nolapse
        uses: nolapse/nolapse-action@v1
        with:
          repo-token: ${{ secrets.GITHUB_TOKEN }}
          lang: dotnet
          warn-threshold: "0.5"
          fail-threshold: "1.0"
```

---

## Coverlet Configuration

nolapse will invoke `dotnet test` internally with Coverlet. To configure the coverage format, add a `coverlet.runsettings` file or pass arguments in the nolapse action (exact interface TBD at implementation time).

A minimal `coverlet.runsettings`:

```xml
<?xml version="1.0" encoding="utf-8" ?>
<RunSettings>
  <DataCollectionRunSettings>
    <DataCollectors>
      <DataCollector friendlyName="XPlat code coverage">
        <Configuration>
          <Format>json</Format>
        </Configuration>
      </DataCollector>
    </DataCollectors>
  </DataCollectionRunSettings>
</RunSettings>
```

---

## Get Notified

Watch the [nolapse changelog](/reference/changelog/) for the .NET runner release. Once available, this tutorial will be updated with full working commands and example output.

---

## See Also

- [Tutorial: Go Microservice](/tutorials/go-microservice/) — a fully working tutorial available today
- [Tutorial: Python Django App](/tutorials/python-django/) — a fully working tutorial available today
- [Languages: .NET](/languages/dotnet/) — .NET language reference page
