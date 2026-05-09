# FILE_INDEX.md

Repo map for **[PROJECT_NAME]**. Updated at the end of sessions that add or
rename files. If you only read three things to get oriented: **this file**,
**CLAUDE.md** (architecture + last session log), and **RUNBOOK.md** (startup
ritual + live URLs).

---

## Your personal notes

| File | What it is |
|---|---|
| `[notes].md` | Loose ideas, UX nudges, "X should be Y" thoughts. Living scratchpad. |

---

## Project docs

| File | What it is |
|---|---|
| README.md | Public-facing intro + quickstart |
| CLAUDE.md | Architecture map + session log (AI + human guide) |
| FILE_INDEX.md | This file — repo map |
| DESIGN.md | Design tokens + brand rules + component primitives |
| TODO.md | Open follow-ups (done items deleted; git is the archive) |
| RUNBOOK.md | Startup ritual + promotion gates + live URLs |
| AGENTS.md | Agent workflow rules + brief template + worktree pattern |
| STRATEGY.md | Vision, OKRs, business model, roadmap |
| DECISION_LOG.md | Why we made key tech/product decisions |
| CHANGELOG.md | User-facing version history (semver) |
| ACCESSIBILITY.md | A11y notes: what's done, what's pending |
| ATTRIBUTIONS.md | Third-party licenses and credits |

---

## Config + infra

| File | What it is |
|---|---|
| `package.json` | Scripts, deps |
| `tsconfig.json` | TypeScript strict config |
| `vite.config.ts` | Build config |
| `vitest.config.ts` | Test config (coverage thresholds) |
| `playwright.config.ts` | E2E config |
| `.env.example` | All required env vars (never commit `.env`) |
| `.gitignore` | Node, env, build artifacts, worktrees |
| `.github/workflows/ci.yml` | Typecheck + unit + e2e on every PR |
| `.github/PULL_REQUEST_TEMPLATE.md` | PR checklist |

---

## Source

| Path | What it is |
|---|---|
| `src/main.ts` | App entry point |
| `src/types.ts` | Shared TypeScript types |
| `src/constants.ts` | Magic values + configuration |
| `src/utils.ts` | Pure utility functions |
| `src/state.ts` | State management (Store class) |
| `src/auth.ts` | Auth wrappers (Supabase / local) |
| `src/analytics.ts` | Analytics + consent gating |
| `src/theme.ts` | Theme controller (dark/light/system) |
| `src/router.ts` | Client-side routing |
| `src/style.css` | Design tokens + component primitives |

---

## Tests

| Convention | Example |
|---|---|
| Unit tests live beside source | `src/utils.ts` → `src/utils.test.ts` |
| E2E tests live in `tests/e2e/` | `tests/e2e/smoke.spec.ts` |
| Helpers shared across e2e | `tests/e2e/helpers.ts` |

---

## LocalStorage keys

| Key | Value | Notes |
|---|---|---|
| `[name]:theme` | `"dark" \| "light" \| "system"` | |
| `[name]:user` | serialized user object | Cleared on sign-out |

---

## Quick command reference

```sh
npm run dev          # localhost:5173
npm run build        # tsc + vite build → dist/
npm run typecheck    # tsc --noEmit
npm test             # vitest run
npm run test:watch   # vitest interactive
npm run test:e2e     # playwright
npm run lint         # eslint
npm run format       # prettier --write
```
