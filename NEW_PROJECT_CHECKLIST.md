# NEW PROJECT CHECKLIST

Run this every time you start a new project. Don't skip steps.
The goal: arrive at first commit with all infrastructure in place so agent
sessions never get stuck on "where do we deploy?" or "how do we test this?"

---

## Phase 0 — Strategy first (size: S, you alone)

Answer these before writing any code. Write the answers into STRATEGY.md.

- [ ] **Who is this for?** Name a specific person, not "users". Example: "Quinn, age 4."
- [ ] **What's the single most important thing it does?** If it did only one thing, what?
- [ ] **What does it NOT do?** Explicit scope limits prevent feature creep.
- [ ] **How does it make money?** Freemium? Subscription? One-time? B2B?
- [ ] **How do people find it?** SEO? Word of mouth? App Store? itch.io?
- [ ] **What does "done enough to launch" look like?** Be specific. "User can do X and Y."
- [ ] **Working title validated.** Run a 15-minute trademark + domain + App Store namespace check before locking the name. A real name carries the brand; a codename in Phase 1 turns into a renaming chore in Phase 5 — and renaming is never as cheap as it sounds. Don't carry placeholders into the scaffold.

---

## Phase 1 — Scaffold (size: M, agent-assisted)

### 1.1 Copy the template
```sh
cp -r C:/Users/johnk/projects/_template C:/Users/johnk/projects/[new-project]
cd C:/Users/johnk/projects/[new-project]
```

### 1.2 Fill in the placeholder values
Replace all `[PROJECT_NAME]`, `[your-domain]`, `[org]`, `[repo]`, `[name]` strings:
```sh
# Find all placeholders (verify + replace manually)
grep -r "\[PROJECT_NAME\]\|\[your-domain\]\|\[org\]\|\[repo\]" .
```

### 1.3 Initialize git + GitHub
```sh
git init
git add .
git commit -m "chore: project scaffold"
gh repo create [org]/[repo] --private   # or --public
git remote add origin https://github.com/[org]/[repo].git
git push -u origin main
```

### 1.4 Initialize the Node project
```sh
npm init -y
```

### 1.5 Choose and install the stack (fill in DECISION_LOG.md as you go)

**TypeScript + Vite (recommended for web apps):**
```sh
npm create vite@latest . -- --template react-ts
npm install
npm run dev   # confirm it starts
```

**Next.js (recommended for server-rendered / SEO-heavy apps):**
```sh
npx create-next-app@latest . --typescript --tailwind --app
```

### 1.6 Set up testing
```sh
npm install -D vitest @vitest/coverage-v8 jsdom @testing-library/react
# Add to package.json scripts: "test": "vitest run", "test:watch": "vitest"
# Add vitest.config.ts with coverage thresholds (see template below)
```

Vitest config with coverage thresholds:
```ts
// vitest.config.ts
import { defineConfig } from 'vitest/config';
export default defineConfig({
  test: {
    environment: 'jsdom',
    coverage: {
      provider: 'v8',
      thresholds: { lines: 60, functions: 60, branches: 60 },
    },
  },
});
```

### 1.7 Set up linting + formatting
```sh
npm install -D eslint @typescript-eslint/eslint-plugin prettier eslint-config-prettier
# Add .eslintrc.json and .prettierrc
# Add to package.json scripts: "lint": "eslint src", "format": "prettier --write src"
```

### 1.8 Set up Supabase (if auth + cloud storage are needed)
```sh
# Create Supabase project at supabase.com
# Copy URL + anon key to .env
# Write supabase/migrations/0001_init.sql
# Apply via Supabase SQL editor
```

### 1.9 Connect to deploy provider
```sh
# Cloudflare Pages: dash.cloudflare.com → Workers & Pages → Create
# Connect GitHub repo → build command: npm run build → output: dist
# Set env vars in Pages dashboard (Production + Preview tabs)
# Or Vercel: vercel.com → Add New Project → Import from GitHub
```

### 1.10 Confirm CI is wired
- Push a commit → verify the GitHub Actions CI run passes at
  `https://github.com/[org]/[repo]/actions`

---

## Phase 2 — First feature (size: M)

- [ ] Write the first unit test (even a trivial one) to confirm the test runner works
- [ ] Write the first feature behind that test
- [ ] Scaffold the **User menu in the bottom-left** of the primary surface, even if it just renders "Sign in" — same place, every app, so John doesn't have to remember where settings live in this project
- [ ] Open a PR for it (even solo) — this proves the PR template + CI are wired
- [ ] Merge and confirm auto-deploy to preview URL
- [ ] Update CLAUDE.md with the architecture section — what is this, what's the stack,
      what are the invariants

---

## Phase 3 — Launch readiness (before going public)

- [ ] Privacy Policy drafted and visible at `/privacy`
- [ ] Terms of Service drafted and visible at `/terms`
- [ ] Analytics consent banner (if collecting PII)
- [ ] 404 page exists
- [ ] Error boundary wraps the app root (catches JS crashes gracefully)
- [ ] Tested on mobile (360px viewport, real device if possible)
- [ ] Tested on slow network (Chrome DevTools → Slow 3G)
- [ ] `npm run build` produces no errors or warnings
- [ ] No `console.log` debug statements in the build (`grep -r "console.log" src/`)
- [ ] No secrets in the build (`grep -r "sk_\|secret\|password" dist/`)
- [ ] Lighthouse score ≥ 90 performance, ≥ 90 accessibility
- [ ] Custom domain pointing to deploy provider
- [ ] RUNBOOK.md Live URLs section filled in with real URLs
- [ ] **Reportability of success metrics verified.** Run the actual queries against the project's success metrics — confirm the schema captures the data, the dashboard renders, the numbers are accessible. "We plan to measure" doesn't ship; "we have measured" does. Skip only if the project has an explicit anti-telemetry pillar (e.g., Bearing) — and even then, server-side aggregate queries on first-party data should be verified.

---

## Phase 4 — Post-launch

- [ ] Set up error alerting (Sentry free tier, or email on Cloudflare Workers error rate spike)
- [ ] Monitor analytics for Day 1 drop-off points
- [ ] Ship at least one bug fix or UX improvement within 48 hours of launch
      (signals to users the project is alive)
- [ ] Add a CHANGELOG.md entry for the launch
