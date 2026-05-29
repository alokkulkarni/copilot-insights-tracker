# Test Plan — Copilot Insights Tracker

## Unit Tests (Vitest)

| File | Coverage target |
|------|----------------|
| `src/utils/dataHelpers.js` | 100% — pure functions, fully testable |
| `src/components/StatCard.jsx` | 90%+ |
| `src/components/Header.jsx` | 80%+ |
| `src/components/Footer.jsx` | 100% |
| `src/App.jsx` | 80%+ |

Run: `npm test`
Coverage: `npm run test:coverage` (threshold: 80% statements/branches/functions/lines)

## E2E Tests (Playwright)

| Spec | What it covers |
|------|---------------|
| `e2e/homepage.spec.js` | Navigation, page title, not-connected state |
| `e2e/mobile.spec.js` | Hamburger menu, touch targets, no horizontal overflow |
| `e2e/accessibility.spec.js` | Landmark roles, alt text, form labels, aria attributes |
| `e2e/setup.spec.js` | Settings form, token field type, save button |

Run: `npm run test:e2e`

## Browser Matrix

- Chromium (Desktop)
- Firefox (Desktop)
- WebKit / Safari (Desktop)
- Pixel 7 (Android mobile)
- iPhone 14 (iOS mobile)
- iPad (tablet)

## Manual Checks

- [ ] Verify WCAG 2.1 AA contrast ratios with browser DevTools
- [ ] Test with screen reader (VoiceOver / NVDA)
- [ ] Verify keyboard navigation through all interactive elements
- [ ] Test with real GitHub PAT and organisation
