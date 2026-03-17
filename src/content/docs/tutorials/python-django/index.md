---
title: "Tutorial: Python Django App"
description: End-to-end walkthrough — create a Django app with pytest-cov, init a nolapse baseline, simulate a coverage regression, fix it, and add a GitHub Actions gate.
---

This tutorial walks through adding nolapse coverage enforcement to a Django application. It covers pytest-cov configuration, baseline creation, regression simulation, and CI integration.

**Time to complete:** 20–30 minutes.

---

## Prerequisites

- Python 3.9 or later
- nolapse CLI installed (`go install github.com/nolapse/nolapse-cli/nolapse-cli/cmd/nolapse@latest`)

---

## Part 1 — Create the Django App

### 1.1 Set up the project

```bash
mkdir hello-django && cd hello-django
git init
python3 -m venv .venv
source .venv/bin/activate
pip install django pytest pytest-cov pytest-django
django-admin startproject config .
python manage.py startapp greet
```

### 1.2 Write a view

Edit `greet/views.py`:

```python
from django.http import JsonResponse


def health(request):
    return JsonResponse({"status": "ok"})


def greet(request):
    name = request.GET.get("name", "world")
    return JsonResponse({"message": f"Hello, {name}!"})
```

Edit `config/urls.py`:

```python
from django.urls import path
from greet import views

urlpatterns = [
    path("health/", views.health),
    path("greet/", views.greet),
]
```

### 1.3 Configure pytest

Create `pytest.ini`:

```ini
[pytest]
DJANGO_SETTINGS_MODULE = config.settings
addopts = --cov=greet --cov-report=json --cov-report=term-missing
```

### 1.4 Write the tests

Create `greet/tests.py`:

```python
import pytest
from django.test import Client


@pytest.fixture
def client():
    return Client()


def test_health(client):
    response = client.get("/health/")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_greet_default(client):
    response = client.get("/greet/")
    assert response.status_code == 200
    assert response.json() == {"message": "Hello, world!"}


def test_greet_named(client):
    response = client.get("/greet/?name=Alice")
    assert response.status_code == 200
    assert response.json() == {"message": "Hello, Alice!"}
```

### 1.5 Run the tests

```bash
pytest
```

Expected output (last lines):

```text
---------- coverage: platform linux, python 3.12 ----------
Name              Stmts   Miss  Cover
-------------------------------------
greet/views.py        8      0   100%
-------------------------------------
TOTAL                 8      0   100%

3 passed in 0.42s
```

---

## Part 2 — Add nolapse

### 2.1 Initialise the baseline

```bash
nolapse init --repo . --lang python
```

Expected output:

```text
measuring coverage...
coverage: 100.00%
baseline written to .audit/coverage/baseline.md
nolapse.yaml created
```

### 2.2 Inspect the files

```bash
cat .audit/coverage/baseline.md
```

```text
coverage: 100.00%
timestamp: 2026-03-18T09:00:00Z
commit: a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2
```

```bash
cat nolapse.yaml
```

```yaml
lang: python
warn_threshold: 0.5
fail_threshold: 1.0
```

### 2.3 Commit the baseline

```bash
git add .audit/coverage/baseline.md nolapse.yaml greet/ config/ pytest.ini manage.py
git commit -m "chore: add nolapse coverage baseline"
```

### 2.4 Run a coverage check

```bash
nolapse run --repo . --lang python
```

Expected output:

```text
file  baseline coverage  PR coverage  delta    outcome
.     100.00%            100.00%      +0.00%   pass

outcome: pass  delta: +0.00  coverage: 100.00%  baseline: 100.00%
```

---

## Part 3 — Simulate a Regression

### 3.1 Remove a test

Delete `test_greet_named` from `greet/tests.py`. Save the file.

### 3.2 Run nolapse

```bash
nolapse run --repo . --lang python
```

Expected output:

```text
file  baseline coverage  PR coverage  delta    outcome
.     100.00%            87.50%       -12.50%  fail

outcome: fail  delta: -12.50  coverage: 87.50%  baseline: 100.00%
warn_threshold: 0.5  fail_threshold: 1.0
```

Exit code is `1`. The regression was detected.

### 3.3 Restore the test

Add `test_greet_named` back. Re-run:

```bash
nolapse run --repo . --lang python
```

```text
file  baseline coverage  PR coverage  delta    outcome
.     100.00%            100.00%      +0.00%   pass
```

---

## Part 4 — Add the GitHub Action

Create `.github/workflows/coverage.yml`:

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

      - name: Set up Python
        uses: actions/setup-python@v5
        with:
          python-version: "3.12"

      - name: Install dependencies
        run: pip install django pytest pytest-cov pytest-django

      - name: Run nolapse
        uses: nolapse/nolapse-action@v1
        with:
          repo-token: ${{ secrets.GITHUB_TOKEN }}
          lang: python
          warn-threshold: "0.5"
          fail-threshold: "1.0"
```

Commit and push:

```bash
git add .github/workflows/coverage.yml
git commit -m "ci: add nolapse coverage gate"
git push -u origin main
```

Open a pull request. The coverage check runs automatically on every PR.

---

## What You Built

- A Django app with views tested via pytest-django
- pytest.ini configured to generate `coverage.json` on every run
- A nolapse baseline committed to git
- A GitHub Actions workflow enforcing coverage on every PR

---

## Next Steps

- [Exclude Generated Code](/how-to/exclude-generated/) — exclude Django migrations from coverage
- [Raise Your Coverage Threshold](/how-to/raise-threshold/) — tighten enforcement over time
- [Multi-Language Projects](/how-to/multi-language/) — add a Go service alongside the Django app
