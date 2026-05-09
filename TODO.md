# TODO.md

Open follow-ups for **[PROJECT_NAME]**.

**Convention:** Done items are DELETED, not crossed out — git history is the
archive. Add new items at the bottom of the relevant section with a short
rationale. Items without a clear owner or rationale get pruned on housekeeping sweeps.

---

## ⚠️ Critical (blocking release)

- [ ] 

---

## Auth + data

- [ ] 

---

## UI / UX

- [ ] 

---

## Performance

- [ ] 

---

## Testing

- [ ] Add Vitest coverage thresholds (`coverage.thresholds` in vitest.config)
- [ ] Add Playwright E2E smoke test for the happy path
- [ ] Add accessibility audit (axe-core or manual NVDA/VoiceOver check)

---

## Security

- [ ] Confirm RLS policies on all Supabase tables
- [ ] Confirm no secrets in client bundle (`npm run build && grep -r "sk_" dist/`)
- [ ] Add rate limiting to any user-facing mutation endpoints

---

## Infra + deploy

- [ ] Set up Cloudflare Pages / Vercel project
- [ ] Configure env vars in deploy dashboard (Production AND Preview tabs)
- [ ] Set up custom domain + SSL
- [ ] Configure analytics (PostHog / Plausible)
- [ ] Set up error tracking (Sentry free tier)

---

## Legal

- [ ] Draft Privacy Policy (AI draft ok; needs human review before public launch)
- [ ] Draft Terms of Service
- [ ] Confirm data residency requirements for target markets
- [ ] Add cookie/analytics consent banner if collecting PII

---

## Monetization

- [ ] Set up Stripe (or payment provider of choice)
- [ ] Define freemium limits / paywall placement
- [ ] Build upgrade CTA flow

---

## Mobile

- [ ] Audit every view at 360px viewport width
- [ ] Add touch equivalents for any hover-only affordances
- [ ] Test on real iOS + Android device (not just DevTools)
- [ ] Set tap target minimum: 44×44px for all interactive elements

---

## Someday / maybe

- [ ] 
