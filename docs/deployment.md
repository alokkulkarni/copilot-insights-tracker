# Deployment Guide

## Local Development

```bash
cp .env.example .env
# Edit .env with your GitHub token and org
npm install
npm run dev
# Open http://localhost:4001
```

## Docker (Development)

```bash
docker compose --profile dev up
```

## Docker (Production)

```bash
docker compose --profile prod up --build
# App served at http://localhost:8080
```

## CloudFront + S3

1. **Build**
   ```bash
   npm run build
   ```

2. **Upload to S3**
   ```bash
   aws s3 sync dist/ s3://your-bucket-name --delete
   ```

3. **CloudFront settings**
   - Origin: S3 bucket with Origin Access Control (OAC)
   - Default root object: `index.html`
   - Custom error response: 404 → `/index.html` (200) for SPA routing
   - **Viewer Protocol Policy: Redirect HTTP to HTTPS** (WAP-009)
   - Attach a Response Headers Policy with:
     - `X-Frame-Options: SAMEORIGIN`
     - `X-Content-Type-Options: nosniff`
     - `X-XSS-Protection: 1; mode=block`
     - `Strict-Transport-Security: max-age=31536000; includeSubDomains`

4. **Invalidate cache after deploy**
   ```bash
   aws cloudfront create-invalidation --distribution-id YOUR_DIST_ID --paths "/*"
   ```

## Environment Variables

See `.env.example`. The app reads:
- `VITE_GITHUB_TOKEN` — GitHub PAT (only used in dev; in prod the user enters it in the UI)
- `VITE_GITHUB_ORG` — Default org name
- `VITE_GITHUB_API_BASE` — API base URL (default: `https://api.github.com`)
- `VITE_REFRESH_INTERVAL` — Auto-refresh interval in ms (default: 300000)

> **Note:** In production, credentials are entered by the user in the Settings page and stored in `localStorage`. No secrets need to be baked into the build.
