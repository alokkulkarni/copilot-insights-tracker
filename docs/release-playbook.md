# Release Playbook — copilot-insights-tracker

---

## 1. Document Control

| Field            | Value                                                                 |
|------------------|-----------------------------------------------------------------------|
| **Title**        | Release Playbook — copilot-insights-tracker                          |
| **Playbook ID**  | PLY-REL-001                                                           |
| **Version**      | 1.0.0                                                                 |
| **Status**       | Draft                                                                 |
| **Owner**        | Alok Kulkarni                                                         |
| **Created**      | 2026-05-26                                                            |
| **Last Reviewed**| 2026-05-26                                                            |
| **Repository**   | ghcr.io/alokkulkarni/copilot-insights-tracker                        |
| **Approvers**    | <!-- PLACEHOLDER: Engineering Lead, QA Lead, Security Lead -->        |

---

## 2. Purpose & Scope

### Objective

This playbook governs the end-to-end release process for **copilot-insights-tracker**, a React 18 single-page application that surfaces GitHub Copilot usage metrics for an organisation. It defines the sequence of activities, gates, approvals, and rollback procedures required to promote a release candidate from staging to production safely and repeatably.

### In Scope

- All production deployments of `ghcr.io/alokkulkarni/copilot-insights-tracker`
- CI pipeline execution (lint, unit tests, coverage, CodeQL, Trivy FS scan, Docker build/push)
- CD pipeline execution across all four environments: **dev → sit → staging → prod**
- Image scanning (Trivy, Grype, Docker Scout) and CVE gating
- Playwright E2E regression and integration test execution
- Rollback to the previous stable image tag
- Post-deployment validation and sign-off

### Out of Scope

- Changes to GitHub organisation settings or Copilot licence management
- Infrastructure provisioning (Docker host, DNS, TLS certificates)
- GitHub Actions runner maintenance
- Hotfix releases (covered by a separate emergency change procedure)

### Intended Audience

Release managers, engineers, QA leads, and security reviewers involved in promoting a release to production.

---

## 3. Component Overview

### Architecture Summary

```
┌─────────────────────────────────────────────────────────────────┐
│                        GitHub Actions CI/CD                      │
│                                                                   │
│  push/PR ──► lint ──► unit-tests ──► security-scan              │
│                              │                                    │
│                              ▼                                    │
│                    docker-build-push                              │
│                    ghcr.io/alokkulkarni/copilot-insights-tracker │
│                              │                                    │
│              ┌───────────────┼───────────────┐                   │
│              ▼               ▼               ▼                   │
│           CD-dev          CD-sit        CD-staging               │
│         (auto)           (auto)      (auto + approval)           │
│                                           │                       │
│                                    regression-tests               │
│                                    integration-tests              │
│                                           │                       │
│                                       CD-prod                    │
│                                  (manual + approval)             │
└─────────────────────────────────────────────────────────────────┘

Runtime: nginx:1.27-alpine (non-root) serving Vite/React SPA
Registry: GitHub Container Registry (GHCR)
Deployment model: Immutable image, Docker Compose in-place replacement
```

### Technology Stack

| Layer            | Technology                          | Version  |
|------------------|-------------------------------------|----------|
| Frontend         | React                               | 18.3.1   |
| Build tool       | Vite                                | 6.4.2    |
| Runtime server   | nginx                               | 1.27-alpine |
| Container base   | node:20-alpine (build), nginx:1.27-alpine (serve) | — |
| Package manager  | npm                                 | lockfile v3 |
| Unit tests       | Vitest + Testing Library            | 3.2.4    |
| E2E tests        | Playwright                          | 1.60.0   |
| Linter           | ESLint                              | 9.39.4   |
| Image registry   | GitHub Container Registry (GHCR)    | —        |
| Routing          | React Router DOM                    | 6.30.3   |
| Charts           | Recharts                            | 2.12.7   |

### Deployment Model

**Immutable image, in-place Docker Compose replacement.** Each release produces a new image tagged with the short git SHA (e.g. `sha-abc1234`) and optionally a semver tag. Production deployments pull the exact image tag — no rebuilds occur during CD. On health-check failure, the previous image tag is automatically re-deployed.

---

## 4. Prerequisites

### Access Requirements

| Requirement                                  | Who Needs It              |
|----------------------------------------------|---------------------------|
| GitHub repository write access               | Release engineer          |
| GitHub Environment reviewer role (`staging`) | Staging approver          |
| GitHub Environment reviewer role (`prod`)    | Production approver       |
| GHCR pull access (`packages: read`)          | CD runner (GITHUB_TOKEN)  |
| GHCR push access (`packages: write`)         | CI runner (GITHUB_TOKEN)  |
| Docker host SSH / console access             | On-call engineer (rollback) |
| SMTP credentials (`SMTP_*` secrets)          | Image scan notifications  |

### Required Secrets (GitHub Repository Settings → Secrets)

| Secret Name          | Purpose                                      |
|----------------------|----------------------------------------------|
| `VITE_GITHUB_TOKEN`  | GitHub PAT for Copilot API calls (read:org, manage_billing:copilot) |
| `VITE_GITHUB_ORG`    | GitHub organisation name                     |
| `SMTP_SERVER`        | SMTP host for scan email reports             |
| `SMTP_PORT`          | SMTP port                                    |
| `SMTP_USERNAME`      | SMTP authentication username                 |
| `SMTP_PASSWORD`      | SMTP authentication password                 |
| `SMTP_FROM`          | Sender address for scan reports              |

### Required Variables (GitHub Repository Settings → Variables, per Environment)

| Variable Name          | Environment | Purpose                          |
|------------------------|-------------|----------------------------------|
| `DEV_HEALTH_URL`       | dev         | Smoke test endpoint              |
| `SIT_HEALTH_URL`       | sit         | Smoke test endpoint              |
| `STAGING_HEALTH_URL`   | staging     | Smoke test endpoint              |
| `PROD_HEALTH_URL`      | prod        | Smoke test endpoint              |

### Environment Readiness Checklist

Before initiating a release, confirm all of the following:

- [ ] All CI checks pass on the release branch (`main`)
- [ ] Code coverage ≥ 80% (statements, branches, functions, lines)
- [ ] No CRITICAL or HIGH CVEs in `npm audit` output
- [ ] No CRITICAL or HIGH CVEs in Trivy filesystem scan
- [ ] Docker image successfully pushed to GHCR with correct SHA tag
- [ ] Staging deployment is healthy (HTTP 200 on `STAGING_HEALTH_URL`)
- [ ] Regression tests pass against staging
- [ ] Integration tests pass against staging
- [ ] Image scan shows no new CRITICAL CVEs vs previous scan
- [ ] GitHub Environment `prod` has at least one required reviewer configured
- [ ] Previous production image tag is recorded in `.github/reports/prod/` for rollback reference
- [ ] Change window is open (see Section 7)
- [ ] On-call engineer is available and briefed

---

## 5. Deployment Strategy

### Overview

Releases follow a **linear promotion pipeline**: dev → sit → staging → prod. Each environment is a gate. Production is always a manual, approval-gated deployment.

---

### Phase 1 — Code Integration & CI

**Objective:** Validate code quality, security posture, and produce a deployable image.

**Steps:**

1. Merge feature branch to `main` via pull request (requires passing CI on the PR branch).
2. CI pipeline triggers automatically on push to `main`:
   - `lint-and-format` — ESLint across `src/`
   - `unit-tests` — Vitest with coverage; enforces 80% threshold on statements, branches, functions, and lines
   - `security-scan` — CodeQL (JavaScript), `npm audit --audit-level=high`, Trivy FS scan (CRITICAL + HIGH fail)
   - `docker-build-push` — multi-stage build (`Dockerfile.prod`), tagged `sha-<short-sha>` + `latest`, pushed to `ghcr.io/alokkulkarni/copilot-insights-tracker`, SBOM generated
   - `commit-reports` — dated coverage and security reports committed to `.github/reports/YYYY-MM-DD/`
3. Confirm all CI jobs show green in GitHub Actions.

**Dependencies:** Pull request approved and merged to `main`.

**Duration estimate:** 8–12 minutes.

**Rollback trigger:** Any CI job failure blocks promotion. Fix the issue and re-push; do not proceed to Phase 2.

---

### Phase 2 — Dev Deployment

**Objective:** Validate the image runs correctly in the first environment.

**Steps:**

1. CI completion on `main` triggers `CD - dev` automatically (push to `develop` branch, or manually dispatch with the SHA tag).
2. GitHub Actions pulls `ghcr.io/alokkulkarni/copilot-insights-tracker:sha-<short-sha>`.
3. `docker compose -f docker-compose.yml up -d --pull always` replaces the running container.
4. Smoke test polls `DEV_HEALTH_URL` (10 attempts × 10s = 100s max).
5. Deployment report committed to `.github/reports/dev/YYYY-MM-DD/deployment.json`.

**Dependencies:** Phase 1 complete; Docker host accessible from runner.

**Duration estimate:** 3–5 minutes.

**Rollback trigger:** Smoke test fails after 10 attempts → `docker compose down` executed automatically; deployment report records `status: failure`.

---

### Phase 3 — SIT Deployment

**Objective:** System integration testing with the release candidate.

**Steps:**

1. Push to `sit` branch (or manually dispatch `CD - sit` with the SHA tag).
2. GitHub Actions pulls and deploys the same image tag as Phase 2.
3. Smoke test polls `SIT_HEALTH_URL` (10 attempts × 10s).
4. QA team executes manual SIT test cases against the SIT environment.
5. QA lead signs off on SIT completion.
6. Deployment report committed to `.github/reports/sit/YYYY-MM-DD/deployment.json`.

**Dependencies:** Phase 2 successful; QA team available.

**Duration estimate:** 5–30 minutes (automated: 5 min; manual SIT: variable).

**Rollback trigger:** Smoke test failure → automatic rollback. Manual SIT failures → raise defect, do not promote to staging.

---

### Phase 4 — Staging Deployment & Validation

**Objective:** Final pre-production validation with full regression and integration test suites.

**Steps:**

1. Push to `main` triggers `CD - staging` automatically.
2. **Manual approval gate:** A configured reviewer in the `staging` GitHub Environment must approve the deployment in GitHub Actions before it proceeds.
3. GitHub Actions pulls and deploys the image.
4. Smoke test polls `STAGING_HEALTH_URL` (10 attempts × 10s).
5. `Regression Tests` workflow triggers automatically on `CD - staging` completion:
   - Playwright E2E suite runs against staging (`npm run test:e2e`)
   - Results compared against n-1 run; workflow fails if new test failures detected
6. `Integration Tests` workflow triggers automatically on `CD - staging` completion:
   - Playwright E2E suite runs against staging
   - JUnit XML and HTML report committed to `.github/reports/integration/YYYY-MM-DD/`
7. Image scan (`Image Scan` workflow) runs on push to `main`:
   - Trivy, Grype, Docker Scout scan the pushed image
   - Results compared against n-1; workflow fails on new CRITICAL CVEs
   - Scan report emailed to `kulkarni.alok@gmail.com`
8. Release engineer reviews all results and confirms go/no-go.

**Dependencies:** Phase 3 signed off; staging GitHub Environment reviewer available.

**Duration estimate:** 15–25 minutes.

**Rollback trigger:** Smoke test failure → automatic rollback to previous image tag. Regression test failures or new CRITICAL CVEs → do not promote to production; investigate and fix.

---

### Phase 5 — Production Deployment

**Objective:** Deploy the validated release candidate to production.

**Steps:**

1. Release engineer navigates to **GitHub Actions → CD - prod → Run workflow**.
2. Enter the exact image tag (e.g. `sha-abc1234` or `v1.2.3`) in the `image_tag` input.
3. Enter `deploy-to-prod` in the `confirm` input.
4. **Manual approval gate:** A configured reviewer in the `prod` GitHub Environment must approve before the job proceeds.
5. GitHub Actions pulls `ghcr.io/alokkulkarni/copilot-insights-tracker:<image_tag>`.
6. Previous image tag is recorded from `.github/reports/prod/` for rollback reference.
7. `docker compose -f docker-compose.yml up -d --pull always` replaces the running container.
8. Smoke test polls `PROD_HEALTH_URL` (15 attempts × 15s = 225s max).
9. On success: deployment report committed to `.github/reports/prod/YYYY-MM-DD/deployment.json`.
10. Post-deployment validation executed (see Section 12).
11. Release engineer sends completion notification.

**Dependencies:** Phase 4 fully validated; prod GitHub Environment reviewer available; change window open.

**Duration estimate:** 5–10 minutes (automated); 15–30 minutes including post-deployment validation.

**Rollback trigger:** Smoke test fails after 15 attempts → automatic rollback to previous image tag via `docker compose up -d` with `PREV_IMAGE_TAG`. Workflow exits non-zero and deployment report records `status: failure`.

---

## 6. Environment Matrix

| Environment | Region                        | Tier        | Purpose                                      | Deployment Order |
|-------------|-------------------------------|-------------|----------------------------------------------|-----------------|
| dev         | <!-- PLACEHOLDER: local/DC --> | Non-prod    | Developer integration; auto-deploy on push   | 1               |
| sit         | <!-- PLACEHOLDER: local/DC --> | Non-prod    | System integration testing; QA validation    | 2               |
| staging     | <!-- PLACEHOLDER: local/DC --> | Pre-prod    | Final regression + integration gate; approval required | 3      |
| prod        | <!-- PLACEHOLDER: local/DC --> | Production  | Live service; manual dispatch + approval only | 4              |

---

## 7. Change Management

| Field                | Value                                                                 |
|----------------------|-----------------------------------------------------------------------|
| **Change Type**      | Normal                                                                |
| **Change Window**    | <!-- PLACEHOLDER: e.g. Tuesday–Thursday 10:00–16:00 UTC -->          |
| **CAB Approval Path**| <!-- PLACEHOLDER: Submit RFC 5 business days before release; CAB reviews at weekly meeting --> |
| **Freeze Periods**   | <!-- PLACEHOLDER: Last 2 weeks of each quarter; major public holidays --> |
| **Emergency Change** | Requires CISO + Engineering Lead approval; abbreviated testing permitted with documented risk acceptance |

### Pre-Change Checklist

- [ ] RFC raised and approved by CAB (Normal change)
- [ ] Change window confirmed with operations team
- [ ] On-call engineer briefed and available
- [ ] Rollback procedure reviewed (Section 9)
- [ ] Stakeholders notified per Communication Plan (Section 10)

---

## 8. Risk Register

| ID     | Risk / Issue                                      | Category    | Probability | Impact   | Mitigation                                                                 | Owner                  | Status  |
|--------|---------------------------------------------------|-------------|-------------|----------|----------------------------------------------------------------------------|------------------------|---------|
| RSK-01 | New CRITICAL CVE introduced in dependency         | Security    | Medium      | High     | Trivy + Grype + npm audit gate in CI; daily image scan; fail-fast on new CRITICAL CVEs | Security Lead | Open    |
| RSK-02 | Docker image pull fails during CD (GHCR outage)   | Availability| Low         | High     | Retry logic in workflow; previous image remains running until replacement succeeds | Release Engineer | Open |
| RSK-03 | Smoke test false negative (health endpoint returns 200 but app is broken) | Quality | Medium | High | Playwright regression tests provide deeper validation before prod promotion | QA Lead | Open |
| RSK-04 | GitHub PAT (`VITE_GITHUB_TOKEN`) expires mid-release | Security | Medium | Medium | Rotate PAT before expiry; set calendar reminder 30 days before expiry | Owner | Open |
| RSK-05 | Regression test detects new failure vs n-1        | Quality     | Medium      | High     | Workflow blocks promotion automatically; engineer investigates before re-running | QA Lead | Open |
| RSK-06 | Production rollback fails (previous image tag not recorded) | Availability | Low | Critical | `.github/reports/prod/` records every deployment; fallback to `latest` tag | Release Engineer | Open |
| RSK-07 | Accidental production deploy without approval     | Governance  | Low         | Critical | `workflow_dispatch` only; confirmation string required; GitHub Environment approval gate | Engineering Lead | Open |
| RSK-08 | Coverage drops below 80% threshold               | Quality     | Low         | Medium   | Vitest coverage threshold enforced in CI; PR blocked if threshold not met | Engineering Lead | Open |
| RSK-09 | nginx security headers missing after config change | Security   | Low         | Medium   | nginx.conf reviewed in PR; SECURITY.md documents required headers | Security Lead | Open |
| RSK-10 | SMTP credentials for scan reports expire or rotate | Operations | Medium      | Low      | Scan email failure does not block deployment; alert on SMTP job failure | Owner | Open |

---

## 9. Rollback Strategy

### Trigger Conditions

Initiate rollback if any of the following occur after a production deployment:

- Smoke test fails (automated — triggers rollback automatically within the CD workflow)
- Error rate increases above baseline within 15 minutes of deployment
- Any P1/P2 incident raised that is attributable to the release
- Business stakeholder requests rollback

### Automated Rollback (within CD workflow)

The `CD - prod` workflow automatically rolls back if the smoke test fails:

```yaml
# Excerpt from cd-prod.yml
echo "CRITICAL: Health check failed — rolling back to ${{ env.PREV_IMAGE_TAG }}"
export IMAGE_TAG=${{ env.PREV_IMAGE_TAG }}
docker compose -f docker-compose.yml up -d --pull always
```

The previous image tag is read from the most recent `deployment.json` in `.github/reports/prod/`.

### Manual Rollback Procedure

If automated rollback does not trigger or fails, execute the following:

**Step 1 — Identify the previous stable image tag**

```bash
# Find the last successful deployment report
cat .github/reports/prod/$(ls .github/reports/prod/ | sort | tail -2 | head -1)/deployment.json
# Note the "image" field, e.g. "ghcr.io/alokkulkarni/copilot-insights-tracker:sha-abc1234"
```

**Step 2 — Trigger rollback via workflow dispatch**

Navigate to **GitHub Actions → CD - prod → Run workflow** and enter the previous image tag.

**Step 3 — Manual Docker rollback (if GitHub Actions is unavailable)**

```bash
# On the Docker host
docker pull ghcr.io/alokkulkarni/copilot-insights-tracker:<PREV_TAG>
IMAGE_TAG=<PREV_TAG> IMAGE_NAME=ghcr.io/alokkulkarni/copilot-insights-tracker \
  docker compose -f docker-compose.yml up -d --pull always
```

**Step 4 — Verify rollback**

```bash
curl -s -o /dev/null -w "%{http_code}" <PROD_HEALTH_URL>
# Expected: 200
```

**Step 5 — Notify stakeholders** per Communication Plan (Section 10).

**Step 6 — Raise incident** and document root cause before re-attempting the release.

### Rollback Time Objective (RTO)

| Scenario                        | Target RTO |
|---------------------------------|------------|
| Automated rollback (smoke test) | ≤ 5 minutes |
| Manual workflow dispatch        | ≤ 15 minutes |
| Manual Docker host rollback     | ≤ 20 minutes |

---

## 10. Communication Plan

| Phase                        | Audience                              | Channel                          | Owner             | Timing                          |
|------------------------------|---------------------------------------|----------------------------------|-------------------|---------------------------------|
| Release scheduled            | Engineering, QA, Operations           | Email / Slack #releases          | Release Engineer  | 48 hours before change window   |
| CI passed — image ready      | Engineering Lead                      | Slack #ci-cd                     | Automated (GHA)   | On CI completion                |
| Staging deployment approved  | QA Lead, Engineering Lead             | Slack #deployments               | Release Engineer  | Before staging approval         |
| Staging validation complete  | Engineering Lead, Product Owner       | Email / Slack #releases          | QA Lead           | After regression tests pass     |
| Production deployment start  | Operations, On-call engineer          | Slack #incidents, PagerDuty      | Release Engineer  | 15 minutes before deploy        |
| Production deployment success| All stakeholders                      | Email / Slack #releases          | Release Engineer  | Within 10 minutes of completion |
| Rollback initiated           | Engineering Lead, Operations, On-call | Slack #incidents, PagerDuty page | Release Engineer  | Immediately                     |
| Rollback complete            | All stakeholders                      | Email / Slack #incidents         | Release Engineer  | Within 5 minutes of rollback    |
| Post-deployment sign-off     | Product Owner, Engineering Lead       | Email                            | Release Engineer  | Within 1 hour of deployment     |

---

## 11. Success Criteria

### Functional Checks

- [ ] Application loads at the production URL without errors
- [ ] GitHub Copilot metrics dashboard renders correctly with live data
- [ ] Navigation between all pages (Overview, Active Users, Copilot Insights, Reports, Setup) works
- [ ] GitHub API calls succeed (HTTP 200 responses visible in browser network tab)
- [ ] No JavaScript console errors on page load

### Performance Thresholds

- [ ] Health endpoint (`/health`) responds in < 200ms
- [ ] Initial page load (LCP) < 3 seconds on a standard connection
- [ ] Static assets served with `Cache-Control: public, immutable` headers
- [ ] nginx gzip compression active for JS/CSS assets

### Security Checks

- [ ] `X-Frame-Options: SAMEORIGIN` header present
- [ ] `X-Content-Type-Options: nosniff` header present
- [ ] `X-XSS-Protection: 1; mode=block` header present
- [ ] `Referrer-Policy: strict-origin-when-cross-origin` header present
- [ ] No CRITICAL or HIGH CVEs in the deployed image (confirmed by image scan)

### SLO / Reliability Targets

- [ ] Smoke test passes: HTTP 200 on `PROD_HEALTH_URL` within 225 seconds of container start
- [ ] Zero P1 incidents within 30 minutes of deployment
- [ ] Deployment report committed to `.github/reports/prod/YYYY-MM-DD/deployment.json` with `status: success`

---

## 12. Post-Deployment Validation

### Immediate (0–15 minutes post-deployment)

1. **Smoke test** — Confirm `PROD_HEALTH_URL` returns HTTP 200 (automated in CD workflow).
2. **Browser check** — Open the production URL in an incognito window; confirm the app loads and the dashboard renders.
3. **Network tab** — Verify GitHub API calls return 200; no 401/403 errors.
4. **Security headers** — Run `curl -I <PROD_URL>` and confirm all required headers are present.
5. **Container health** — On the Docker host, confirm `docker ps` shows the container as `healthy`.

### Short-term (15–60 minutes post-deployment)

6. **Error monitoring** — Review application logs for unexpected errors:
   ```bash
   docker compose logs --tail=200 prod
   ```
7. **Image scan email** — Confirm scan report email received at `kulkarni.alok@gmail.com`; review for new CVEs.
8. **Deployment report** — Confirm `.github/reports/prod/YYYY-MM-DD/deployment.json` exists with `status: success`.

### Business Sign-off

9. **Product Owner / Service Owner** confirms the release meets acceptance criteria.
10. Release engineer updates the deployment report status and closes the change record.

---

## 13. Contacts & Escalation

| Role                    | Name                                          | Contact                          | Escalation Level |
|-------------------------|-----------------------------------------------|----------------------------------|-----------------|
| Release Engineer        | Alok Kulkarni                                 | kulkarni.alok@gmail.com          | L1              |
| Engineering Lead        | <!-- PLACEHOLDER: Engineering Lead Name -->   | <!-- PLACEHOLDER: contact -->    | L2              |
| QA Lead                 | <!-- PLACEHOLDER: QA Lead Name -->            | <!-- PLACEHOLDER: contact -->    | L2              |
| Security Lead           | <!-- PLACEHOLDER: Security Lead Name -->      | <!-- PLACEHOLDER: contact -->    | L2              |
| On-call Engineer        | <!-- PLACEHOLDER: On-call rotation -->        | PagerDuty / Slack #on-call       | L1 (incidents)  |
| Product Owner           | <!-- PLACEHOLDER: Product Owner Name -->      | <!-- PLACEHOLDER: contact -->    | L3              |
| Infrastructure / Docker Host | <!-- PLACEHOLDER: Ops contact -->        | <!-- PLACEHOLDER: contact -->    | L2              |

**Escalation path:** L1 → L2 (15 min no response) → L3 (30 min no response)

---

## 14. Approvals

| Role              | Name                                        | Signature                        | Date       |
|-------------------|---------------------------------------------|----------------------------------|------------|
| Release Engineer  | Alok Kulkarni                               | <!-- PLACEHOLDER: signature -->  | 2026-05-26 |
| Engineering Lead  | <!-- PLACEHOLDER -->                        | <!-- PLACEHOLDER: signature -->  |            |
| QA Lead           | <!-- PLACEHOLDER -->                        | <!-- PLACEHOLDER: signature -->  |            |
| Security Lead     | <!-- PLACEHOLDER -->                        | <!-- PLACEHOLDER: signature -->  |            |
| Product Owner     | <!-- PLACEHOLDER -->                        | <!-- PLACEHOLDER: signature -->  |            |

---

## Appendix A — CI/CD Pipeline Reference

```
Trigger: push to any branch / pull_request
│
├── lint-and-format          (ESLint, ~2 min)
│
├── unit-tests               (Vitest + coverage ≥80%, ~5 min)
│   └── artifact: coverage-report-{run_id}  [90 days]
│
├── security-scan            (CodeQL + npm audit + Trivy FS, ~8 min)
│   └── artifact: security-scan-{run_id}    [90 days]
│   └── SARIF → GitHub Security tab
│
└── docker-build-push        (only on push, after tests + scan pass, ~5 min)
    └── ghcr.io/alokkulkarni/copilot-insights-tracker:sha-<sha>
    └── SBOM generated (provenance attestation)

On push to main only:
└── commit-reports           (dated reports to .github/reports/YYYY-MM-DD/)
└── image-scan               (Trivy + Grype + Docker Scout, daily 06:00 UTC)
    └── email → kulkarni.alok@gmail.com (SMTP)
    └── fail on new CRITICAL CVEs vs n-1
```

## Appendix B — Deployment Pipeline Reference

```
CD - dev      push to develop  → auto-deploy → smoke test
CD - sit      push to sit      → auto-deploy → smoke test
CD - staging  push to main     → approval gate → deploy → smoke test
                                              → regression-tests (Playwright)
                                              → integration-tests (Playwright)
CD - prod     workflow_dispatch only
              → confirm="deploy-to-prod"
              → approval gate (prod environment)
              → deploy
              → smoke test (15 × 15s)
              → on failure: auto-rollback to PREV_IMAGE_TAG
```

## Appendix C — Rollback Quick Reference

```bash
# 1. Find previous image tag
cat .github/reports/prod/$(ls .github/reports/prod/ | sort | tail -2 | head -1)/deployment.json

# 2. Trigger via GitHub Actions (preferred)
# Actions → CD - prod → Run workflow → enter PREV_TAG

# 3. Manual Docker rollback (emergency)
IMAGE_TAG=<PREV_TAG> IMAGE_NAME=ghcr.io/alokkulkarni/copilot-insights-tracker \
  docker compose -f docker-compose.yml up -d --pull always

# 4. Verify
curl -s -o /dev/null -w "%{http_code}" <PROD_HEALTH_URL>
```

## Appendix D — Required GitHub Environment Configuration

| Environment | Required Reviewers | Protection Rules                        |
|-------------|--------------------|-----------------------------------------|
| dev         | None               | None                                    |
| sit         | None               | None                                    |
| staging     | ≥ 1 reviewer       | Required reviewer must approve before deploy |
| prod        | ≥ 1 reviewer       | Required reviewer must approve before deploy; deployment branch: `main` only |
