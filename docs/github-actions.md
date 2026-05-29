# GitHub Actions Workflows

## Overview

| Workflow | File | Trigger | Purpose |
|----------|------|---------|---------|
| CI | `ci.yml` | Push to `main`, `develop`, `feature/**`, `fix/**`; all PRs | Lint, test, coverage, build, E2E, CodeQL, Docker push |
| PR Checks | `pr-checks.yml` | All non-draft PRs | Fast feedback: lint, unit tests, build check |
| CD Staging | `cd-staging.yml` | Push to `develop`; manual dispatch | Deploy to staging with health check + rollback |
| CD Production | `cd-prod.yml` | Push to `main`; manual dispatch | Deploy to production with approval gate + rollback |
| Image Scan | `image-scan.yml` | Push to `main` (Dockerfile/package changes); daily 06:00 UTC | Trivy CVE scan, npm audit, Dockerfile lint |

---

## Required Secrets

Set these in **Settings → Secrets and variables → Actions**:

| Secret | Used by | Description |
|--------|---------|-------------|
| `GITHUB_TOKEN` | All | Auto-provided by GitHub — no setup needed |
| `SLACK_WEBHOOK` | `cd-prod.yml` (optional) | Slack incoming webhook for rollback notifications |

## Required Variables

Set these in **Settings → Secrets and variables → Actions → Variables**:

| Variable | Used by | Example |
|----------|---------|---------|
| `STAGING_URL` | `cd-staging.yml` | `https://staging.copilot-insights.example.com` |
| `PROD_URL` | `cd-prod.yml` | `https://copilot-insights.example.com` |

## Required GitHub Environments

Create these in **Settings → Environments**:

### `staging`
- No approval required
- Set `STAGING_URL` as an environment variable

### `production`
- **Required reviewers**: add your team leads
- **Wait timer**: 0 minutes (or set a delay if desired)
- Set `PROD_URL` as an environment variable

---

## CI Workflow Detail

```
push / PR
    │
    ├── lint          (ESLint)
    ├── audit         (npm audit --audit-level=high)
    ├── test          (Vitest + coverage ≥80%)
    ├── codeql        (JavaScript static analysis)
    │
    └── build         (needs: lint + test)
            │
            ├── e2e   (Playwright Chromium)
            └── docker-build (push on main/develop only)
```

## CD Workflow Detail

```
develop push → cd-staging.yml
    │
    ├── deploy-staging (GitHub Environment: staging)
    │       ├── resolve image tag
    │       ├── deploy (replace placeholder with your deploy command)
    │       ├── health check (polls /health for up to 2 minutes)
    │       └── smoke tests
    │
    └── rollback-staging (runs only on failure)

main push → cd-prod.yml
    │
    ├── deploy-prod (GitHub Environment: production — requires approval)
    │       ├── verify image exists in GHCR
    │       ├── deploy (replace placeholder with your deploy command)
    │       ├── health check (polls /health for up to 3 minutes)
    │       └── smoke tests
    │
    └── rollback-prod (runs only on failure)
```

## Image Scan Detail

```
daily 06:00 UTC / push to main (Dockerfile or package changes)
    │
    ├── build-for-scan   (builds image locally, no push)
    ├── trivy-scan       (SARIF → GitHub Security tab; fails on CRITICAL/HIGH)
    ├── npm-audit        (fails on CRITICAL/HIGH CVEs)
    └── dockerfile-lint  (Hadolint)
            │
            └── scan-summary (writes to GitHub Actions summary)
```

---

## Customising the Deploy Steps

The CD workflows contain placeholder deploy steps. Replace them with your actual deployment mechanism:

### Docker Compose
```yaml
- name: Deploy
  run: |
    docker compose -f docker-compose.prod.yml pull
    docker compose -f docker-compose.prod.yml up -d --remove-orphans
```

### Kubernetes
```yaml
- name: Deploy
  run: |
    kubectl set image deployment/copilot-insights \
      app=${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:${{ steps.tag.outputs.tag }}
    kubectl rollout status deployment/copilot-insights --timeout=120s
```

### AWS ECS
```yaml
- name: Deploy
  run: |
    aws ecs update-service \
      --cluster prod \
      --service copilot-insights \
      --force-new-deployment
```

---

## Local Workflow Validation

Install [act](https://github.com/nektos/act) to run workflows locally:

```bash
brew install act
act push --job lint
act pull_request --job unit-tests
```
