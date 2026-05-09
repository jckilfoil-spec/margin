# Session Handoff — John Kilfoil

## Who you're talking to
John, 33. Married, daughter Quinn (almost 4). Building AI-native apps and games
to generate income. Has Claude Max + Cowork (voice-driven). Wants to be the
**approver** — reviewing and vetoing agent work, not writing code himself.

---

## What exists at C:\Users\johnk\projects\

### Projects (live)
- **webby-app** (webbyspin.com) — Spun, a calm spider-web drawing toy for kids.
  Vite + TypeScript + Pixi.js v8. 370 tests. Pre-launch, 7 PRs stacked and ready.
- **little-hunters** — Quinn's farm game. React + Vite. localStorage bug fixed this session.
- **veg3D** — 3D generative art player. React Three Fiber, pnpm monorepo.
- **mango-grove** — 4-app Express monorepo (finance, wellness, movement, mental health).

### _template (built this session — the crown jewel)
A complete, AI-native project scaffold. Every new project copies from here.

Key files:
| File | Purpose |
|---|---|
| `PITCH.md` | Soul doc — who it's for, what it feels like. Fill first. |
| `SPEC.md` | Feature spec written in Cowork before any worktree opens |
| `AGENTS.md` | Full agent workflow: 3 laws, spec-driven dev, code health gate, CLAUDE.md hygiene, MCP strategy, Jedi Council, compounding flywheel |
| `DECISION_LOG.md` | 14 decisions with full options/pros/cons/"choose X if" — walk through before writing code |
| `LLM_OPS.md` | Only if product calls an LLM: logging, prompt versioning, cost, evals, data flywheel, scaling path |
| `RUNBOOK.md` | Daily startup ritual, promotion gates (Local→Preview→Prod), pre-agent checklist |
| `CLAUDE.md` | Session log template. Hard limit: 150 lines. |
| `NEW_PROJECT_CHECKLIST.md` | Phase 0–4 from strategy to post-launch |
| `STRATEGY.md`, `DESIGN.md`, `TODO.md`, `FILE_INDEX.md`, `README.md` | Standard scaffold |
| `.github/workflows/ci.yml` | Typecheck + Vitest + build. LLM eval gate stub (commented). |

---

## The Jedi Council (skill: webbys-coucil)

Five seats, invoked in Cowork for any product/business/strategic decision.
Primary job: find the delta between where the product is now and where the money and impact are.

| Seat | Owns |
|---|---|
| **Builder** | Technical feasibility, debt, complexity |
| **Profit** | Unit economics, margin, pricing, payback |
| **Player** | User experience, delight, friction |
| **Shield** | Legal, compliance (COPPA), IP, downside risk |
| **Signal** | Discovery, narrative, data, how people find this |

---

## The workflow (Cowork → Claude Code)

1. **PITCH.md** — fill by voice in Cowork. If you can't write it, you don't know the idea yet.
2. **Council stress-test** — "Is this worth building?" before any spec.
3. **DECISION_LOG.md** — lock the 3 biggest stack decisions.
4. **NEW_PROJECT_CHECKLIST.md Phase 1** — scaffold, GitHub, CI wired. First commit before feature code.
5. **SPEC.md** — fill in Cowork via the interview-first prompt, then sign off.
6. **Claude Code worktree** — agent implements against spec, pushes PR.
7. **John reviews diff** — approves or vetoes. CI runs. Merge.

---

## Where we left off

We just finished upgrading the _template and the Jedi Council skill. John is
ready to **start a brand new project from scratch** using the template for the
first time.

**Next action:** Ask John what the idea is. Then fill out PITCH.md together by
voice, run a council stress-test, lock the stack decisions, and scaffold the repo.
