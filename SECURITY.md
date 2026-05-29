# Security Policy

## Supported Versions

| Version | Supported |
|---------|-----------|
| 1.x     | ✅        |

## Reporting a Vulnerability

Please report security vulnerabilities to your internal security team. Do **not** open a public GitHub issue for security concerns.

## Credential Handling

- GitHub Personal Access Tokens are stored **only in the browser's `localStorage`** on the end-user's machine.
- Tokens are **never** sent to any server other than the GitHub API (`api.github.com` or your GHES instance).
- No tokens or secrets are committed to source control. See `.env.example` for required environment variables.

## Content Security Policy

The app ships with a CSP meta tag in `index.html` that restricts:
- Scripts to `'self'` only
- API connections to `'self'` and `https://api.github.com`
- No inline scripts or eval

## Dependency Auditing

Run `npm audit --audit-level=high` before every production build. The `.npmrc` enforces `audit-level=high`.

## HTTP Security Headers

The `nginx.conf` sets:
- `X-Frame-Options: SAMEORIGIN`
- `X-Content-Type-Options: nosniff`
- `X-XSS-Protection: 1; mode=block`
- `Referrer-Policy: strict-origin-when-cross-origin`

Enable HSTS once HTTPS is confirmed on your deployment.

## CloudFront Deployment

When deploying to CloudFront:
- Enforce HTTPS redirect (HTTP → HTTPS) via CloudFront distribution settings (WAP-009).
- Attach a CloudFront Response Headers Policy with the security headers above.
- Use Origin Access Control (OAC) to restrict S3 bucket access to CloudFront only.
