# RUNBOOK.md

Solo-dev operational guide for **[PROJECT_NAME]**.
Read this before starting work. Update it whenever rituals or gates change.

---

## Live URLs

Bookmark this section. Update it the day you deploy.

### App

| Where | URL | Notes |
|---|---|---|
| Production | https://[your-domain].com | Auto-deploys from `main` |
| Preview (per branch) | `https://<branch>.[your-project].pages.dev` | Auto on push |
| Local dev | http://localhost:5173 | `npm run dev` |

### Repo + CI

| Where | URL | Notes |
|---|---|---|
| GitHub repo | https://github.com/[org]/[repo] | Source of truth |
| Pull requests | https://github.com/[org]/[repo]/pulls | |
| GitHub Actions | https://github.com/[org]/[repo]/actions | CI runs |

### Infrastructure dashboards

| Service | URL | Notes |
|---|---|---|
| Deploy (Cloudflare / Vercel) | | Build logs, rollback |
| Auth + DB (Supabase) | https://supabase.com/dashboard | Pick the right project |
| Analytics (PostHog / Plausible) | | Event stream |
| Error tracking (if any) | | |

---

## Daily startup ritual (5 min)

Run every morning before any other work.

```sh
git fetch                        # 1. see what's on origin
git status                       # 2. see what's local-only
git pull --ff-only               # 3. take origin changes
npm test                         # 4. confirm green baseline
head -120 CLAUDE.md              # 5. read "Last session" + "Pick up here"
wc -l CLAUDE.md                  # 6. if > 150 lines, prune before the session
```

If `git pull --ff-only` refuses, you have diverged commits. Inspect with
`git log --oneline @{u}..HEAD` then push or rebase.

---

## End-of-day ritual (5 min)

Before walking away:

```sh
npm test                         # confirm green
git status                       # confirm nothing uncommitted
# Update CLAUDE.md: refresh "Last session" + "Pick up here"
```

The "Pick up here" block in CLAUDE.md is your cross-session handoff.
If it's stale or missing tomorrow, that's yesterday's bug.

---

## Weekly rhythm

| Day | Focus |
|---|---|
| Mon | Read TODO.md. Pick 1–3 items for the week. Kill rabbit holes. |
| Tue–Thu | Build. One feature per branch. Push frequently. |
| Fri | Promote to prod (see gates below). Update CLAUDE.md. Skim STRATEGY.md. |

---

## Branch strategy

- `main` — what's in production. Always green.
- `feat/<name>` · `fix/<name>` · `docs/<name>` — everything else.
- **Never push directly to main.** PR everything, even solo. The PR
  description is the changelog future-you will thank present-you for.

---

## Cutting a release

### One-time setup (already done)

The Ed25519 signing keypair was generated with:
```sh
npm run tauri signer generate -- --output ~/.tauri/margin.key
```
The private key lives at `~/.tauri/margin.key` (password-protected, never committed).
The public key is committed in `src-tauri/tauri.conf.json` → `plugins.updater.pubkey`.

Add two secrets to the GitHub repo (Settings → Secrets → Actions):
- `TAURI_SIGNING_PRIVATE_KEY` — contents of `~/.tauri/margin.key`
- `TAURI_SIGNING_PRIVATE_KEY_PASSWORD` — the password you chose

### Per-release procedure

1. Ensure `main` is green (`npm test && npm run typecheck`).
2. Bump the version in `src-tauri/tauri.conf.json` and `src-tauri/Cargo.toml` (e.g. `0.0.1` → `0.0.2`).
3. Commit: `git commit -am "chore(release): bump to v0.0.2"`
4. Tag and push:
   ```sh
   git tag v0.0.2
   git push origin main --follow-tags
   ```
5. The `release.yml` workflow fires automatically. Monitor at:
   `https://github.com/jckilfoil-spec/margin/actions`
6. When the workflow succeeds, a **draft** release appears on GitHub with:
   - `margin_0.0.2_x64_en-US.msi` (signed installer)
   - `latest.json` (signed update manifest — Tauri generates this)
7. Review the draft release notes, then promote to **Published**.
8. Existing installs will see the update toast on next launch (5 s after window mount).

### Rollback

Downgrade is not supported by the auto-updater (by design). If a bad release ships:
1. Delete or un-publish the GitHub release.
2. Existing installed copies will no longer see an update offer.
3. If users are on a broken version, publish a fix as the next version (e.g. v0.0.3).

---

## Promotion gates

Three explicit stops. Don't skip one.

### Gate 1 — Local

Feature works in your browser at `localhost`.

**Checklist before pushing:**
- [ ] `npm run typecheck` clean
- [ ] `npm test` green
- [ ] Manually verified in browser (not just compiles)

### Gate 2 — Preview (QA)

`git push origin <branch>` → deploy provider auto-builds → preview URL.
Click through the feature on the preview URL, not localhost.

**Checklist before merging:**
- [ ] CI green (typecheck + unit tests + e2e)
- [ ] Feature works on preview URL
- [ ] Read your own diff one final time
- [ ] If PR touches `src/prompts/`: evals passed in CI (see `LLM_OPS.md`)
- [ ] No new `console.log`, no new `any` in TypeScript

### Gate 3 — Production (main)

Merge the PR → auto-deploy to production.

**After merging:**
- [ ] Visit the production URL and confirm the feature is live
- [ ] Check the analytics dashboard for any error spikes
- [ ] Run the daily startup ritual on main to confirm it's green

**Rollback:** Cloudflare Pages: one-click in the Pages dashboard (any prior
build can become production instantly). Vercel: same — Deployments tab →
Promote.

---

## One-time setup checklist

- [ ] `cp .env.example .env` and fill in all keys
- [ ] Run `npm install`
- [ ] Connect repo to deploy provider (Cloudflare Pages / Vercel)
- [ ] Set env vars in deploy provider dashboard (Production AND Preview tabs)
- [ ] Set up Supabase project (see Supabase setup below)
- [ ] Run `npm run test:e2e:install` for Playwright browser binaries

---

## Supabase project setup

1. Create project at supabase.com → new project → name it `[project-name]`
2. SQL editor → paste `supabase/migrations/0001_init.sql` → Run
3. Enable auth providers: Email (magic link) + Email+password + Google OAuth
4. Auth → URL Configuration → Site URL: `https://[your-domain].com`
   Add `https://*.pages.dev` as wildcard redirect for preview URLs
5. Project Settings → API → copy URL and anon key to `.env` and deploy env vars

---

## Pre-agent session checklist

Run this before opening any worktree or spawning any sub-agent.

```sh
# 1. Tests green?
npm test

# 2. Is the codebase agent-ready? (files > 600 lines = refactor first)
find src/ -name "*.ts" -o -name "*.tsx" | xargs wc -l 2>/dev/null | sort -rn | head -10

# 3. No stray debug code?
grep -r "console.log" src/ | wc -l   # target: 0

# 4. TypeScript clean?
npm run typecheck

# 5. Is the spec written and signed off?
# SPEC.md Status should be: [ ] Ready (not Draft)
```

If any check fails: fix it before spawning agents. Agents in broken or messy
codebases burn tokens, produce incorrect fixes, and make the next session harder.

---

## LLM operations

If this project calls a language model API, read `LLM_OPS.md` before launch.

**The short version:**
- Log every LLM call (model, tokens, latency, cost, feature)
- Version every prompt (`v1.0`, `v1.1`, etc.) in `src/prompts/`
- Set a monthly spend alert at 80% of budget in the Anthropic console
- Add a 👍/👎 feedback widget to every AI-generated output — you'll need that
  signal later when building the data flywheel

---

## Troubleshooting

**"pull --ff-only refused"** — `git log --oneline @{u}..HEAD` to see local
commits; push or rebase.

**"env var not found"** — Vite only inlines `VITE_`-prefixed vars. Restart
dev server after editing `.env`.

**"Playwright: browser not installed"** — `npm run test:e2e:install` once
per machine.

**"localStorage full of test data"** — DevTools → Application → Local
Storage → clear.
