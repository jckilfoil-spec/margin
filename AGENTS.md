# AGENTS.md

The complete rules, patterns, templates, and hard-won lessons for AI agent
sessions across all your projects. **Read this before spawning any agent.**

This doc is the single source of truth. Lessons are added here as they
accumulate — never left buried in a session log or a CLAUDE.md.

---

## The three laws

1. **Every agent gets a time budget.** If an agent hasn't pushed a commit
   by the deadline, it STOPs and reports — no silent hangs, no scope creep.

2. **Every agent works in an isolated worktree.** Never share a checkout
   between agents. Five agents at once is fine; five agents in one folder
   is chaos.

3. **Every agent output lands as a PR.** Nothing merges until you read the
   diff. "Looks good" is a valid review. "Ship it" without reading is not.

---

## Communication conventions

### Effort estimates: T-shirt sizes, never durations

When estimating effort to John, use **T-shirt sizes** (XS / S / M / L / XL) with a one-line reason citing complexity, dependencies, or unknowns. Never use days, hours, or weeks. John runs up to 7 agents in parallel; wall-clock time doesn't track. Relative complexity does.

Examples:
- *"Phase 1 scaffold: **S** — straightforward Vite create + brand token import; one minor unknown around Workbox/Vite SW config."*
- *"Wearables integration: **L** — three vendors, each with different auth model; high unknowns on Polar Web Bluetooth reliability."*
- *"PITCH.md rewrite: **XS** — find/replace mostly, soul intact."*

Time budgets for individual agent runs (e.g., "Stop at 25 minutes") are NOT estimates — they're hang-detection. Keep those.

### QA closes the loop upstream

When a bug is found, the fix is not just a patch. It ships with:

1. A **failing-now-passing test** that would have caught the bug — prevents recurrence.
2. A **note to PITCH/spec** if the bug reveals a structural gap — symptoms can be patched, but root causes belong in the source-of-truth.

A PR that fixes a bug without (1) and (2) gets sent back for closure. Patching the symptom without closing the loop creates the same bug again. This applies to agents and to John.

---

## How we work now (Claude Max + Cowork)

The setup has evolved. Here's the current model:

**Cowork (voice-driven)** is the command center. You narrate intent; Claude
orchestrates — writes docs, surfaces gaps, spawns agents, tracks progress.
This is where product thinking and planning happen.

**Claude Code** is the workhorse. Agents run in isolated worktrees and push
PRs. They don't talk back during a session — they just ship.

**Gemini in Chrome** handles parallel research (market data, SEC filings,
competitor analysis, Google Workspace) without interrupting an active Cowork
session. Jump there when you need information Claude can't reach, then bring
findings back.

**GitHub Copilot** is for real-time inline polish inside VS Code when you
want to touch the code yourself. Secondary now — Cowork + Claude Code covers
most of what Copilot was doing.

---

## AI tool roles — who to use for what

| Tool | Best for | Don't use for |
|---|---|---|
| **Cowork (Claude, voice)** | Requirements, planning, orchestration, reviewing PRs, session handoffs, product decisions, Executive Council sessions | Implementation |
| **Claude Code (sub-agents)** | Implementing features, writing tests, fixing bugs, refactoring — anything with a clear spec | Open-ended exploration |
| **Gemini in Chrome** | Market research, SEC/financial data, Google Workspace, competitor analysis — anything you want running in parallel without interrupting Cowork | Code |
| **GitHub Copilot** | Inline autocomplete and quick edits when you're in VS Code | Long-horizon planning |
| **Codex** | Creative alternatives, algorithm exploration | Production code without review |

**Division of labor for a typical feature:**
1. **You + Claude (Cowork)** → define requirements and acceptance criteria together, Claude prompts for anything missing
2. **Claude (Cowork)** → writes documentation + agent brief, pushes sub-agents forward on well-scoped deliverables
3. **Claude sub-agent (Claude Code, worktree)** → implements the feature, pushes PR
4. **You** → review the PR diff, approve or veto
5. **CI pipeline** → automated tests run, results are observable and reportable; self-healing where possible

**Session handoff pattern (Cowork → Claude Code):**
When you're ready to hand off implementation from a Cowork session:
1. Claude writes the agent brief (see template below)
2. You paste it into Claude Code (or Claude launches it as a sub-agent)
3. Agent works in a worktree, pushes PR
4. You return to Cowork to review the result
The brief is the contract — what's in it is what gets built.

**Rate limit reality:** Claude Max resets independently per tool. If you hit
a wall in one surface, pivot to another rather than waiting.

---

## Spec-driven development

The single highest-ROI change to your agent workflow: **write the spec before
opening a worktree.** Agents starting from an ad hoc brief solve the stated
problem. Agents starting from a spec solve the *right* problem, handle edge
cases you'd have found in QA, and give you acceptance criteria that double as
a test plan.

### The two-session pattern

**Session 1 — Spec (Cowork, voice):** Describe the feature. Claude interviews
you — filling in `SPEC.md` interactively, surfacing edge cases, data model
questions, and scope limits you haven't considered. End of session: spec is
written, reviewed, signed off. No worktree yet.

**Session 2 — Implementation (Claude Code, worktree):** Start fresh. Pass the
spec as context. The agent implements against acceptance criteria, nothing more.
The spec is the contract — deviation is a bug, not a feature.

Why two sessions? The planning session builds context that's useless for
implementation. A fresh session gives the agent a clean window focused entirely
on execution. This is the single biggest quality lever available.

### The interview-first prompt

When starting a spec session in Cowork:

> "I want to add [feature]. Please interview me — ask everything you need to
> write a complete SPEC.md. One question at a time. Don't write the spec until
> you've asked all your questions."

Claude will surface things you haven't thought of. That is the point.

### Spec hygiene

- One `SPEC.md` per feature, in the repo root while active
- When the feature ships: move to `specs/done/SPEC-[name]-YYYY-MM-DD.md`
- If requirements change mid-implementation: update the spec first, then the agent
- Never let spec and code diverge — the spec becoming fiction is how tech debt begins

### When to skip the spec

Bug fixes with a clear root cause. Copy changes, style tweaks, config updates.
Refactors with no behavior change.

**Rule of thumb:** if it touches user-facing behavior or data storage, write the spec.

---

## Code health gate — is this repo agent-ready?

Agents working in messy code burn tokens, make mistakes, and produce fixes that
break other things. The research threshold is **Code Health 9.5/10** — below
that, agent efficiency drops sharply.

**Before opening any worktree, run this pre-flight:**

```sh
# 1. Confirm tests are green
npm test

# 2. Check for obvious debt signals
grep -r "console.log" src/ | wc -l      # should be 0 in production code
grep -r "TODO\|FIXME\|HACK" src/ | wc -l  # flag if > 10
grep -r "any" src/ --include="*.ts" | grep -v ".test." | wc -l  # should be 0

# 3. Check file sizes — agents struggle with files > 600 lines
find src/ -name "*.ts" -o -name "*.tsx" | xargs wc -l | sort -rn | head -10
```

If any file is over 600 lines: **refactor it before spawning agents on it.**
A 2,500-line monolith is not an agent-ready codebase — it's a token furnace.

Add this pre-flight to CLAUDE.md "Pick up here" whenever you know a big agent
session is coming. One-time cleanup pays for itself in the first session.

---

## Worktree isolation pattern

```bash
# The Agent tool's isolation:"worktree" parameter handles this automatically.
# For manual worktrees:
git worktree add .worktrees/feat-my-feature -b feat/my-feature

# Agent works in that folder
cd .worktrees/feat-my-feature
# ... agent does its thing ...
git push origin feat/my-feature

# Back in main — review + merge
gh pr create --head feat/my-feature --title "feat: my feature"
gh pr merge <number> --squash

# Cleanup
git worktree remove .worktrees/feat-my-feature
```

### Critical worktree gotchas (learned the hard way)

- **`.env` does NOT inherit into worktrees.** Copy it manually:
  ```bash
  cp .env .worktrees/feat-my-feature/.env
  ```
  If an agent fails with "env var missing," this is almost always why.

- **`node_modules` does NOT inherit into worktrees.** Agent must run
  `npm install` (and `npm install --prefix apps/<app>` for monorepos)
  before starting work.

- **Git ignores `.worktrees/` and `.claude/`.** Both are in `.gitignore`.
  That's correct. Worktrees are ephemeral; don't commit them.

---

## Agent brief template

Copy this block, fill it in, paste it as your agent prompt.
More detail = fewer clarifying questions = faster, better output.

```
## Context
[1–3 sentences on what the product is and what area we're working in.]
[Name the specific file(s) the agent should touch.]
[State any invariants it must not break. Example: "All mutations go through
Store. Never mutate state directly. Never use `any` in TypeScript."]

## Task
[One sentence: exactly what you want built or fixed.]

## Acceptance criteria
- [ ] [Specific, testable condition 1]
- [ ] [Specific, testable condition 2]
- [ ] `npm test` exits 0 (or `pnpm test` / `npm run typecheck` as appropriate)
- [ ] No new TypeScript errors

## Time budget
Stop at [N] minutes. If you haven't pushed a commit by then, open a draft PR
describing what you completed and what's left, then STOP. Do not continue
past the budget — a partial PR is more useful than a silent hang.

## Off-limits
- Do NOT modify CLAUDE.md, AGENTS.md, RUNBOOK.md, or DECISION_LOG.md
- Do NOT install new dependencies without noting them in the PR description
- Do NOT rename existing exports (breaks call sites in other files)
- Do NOT touch files outside the scope described above
```

---

## Parallel agent pattern (for batched work)

When you need to build multiple independent things at once (e.g., 6 new
generators for veg3D, 10 new template categories for webbyspin), spawn
agents in parallel — not sequentially.

**The rule: one agent, one file.** Each agent gets:
- A single output file to create (e.g., `src/generators/conway.ts`)
- The existing file they should pattern-match against
- An explicit "don't touch anything else" instruction
- A report-back spec: what to return so the *integrating turn* can merge

**Example parallel brief (one of N sent simultaneously):**

```
## Context
veg3D is a web-native 3D generative art player. Each generator lives in
one file in `apps/web/src/generators/`. See `attractor.ts` as the
canonical example of the generator interface.

## Task
Implement Conway's Game of Life as a veg3D generator.

## Output
Create ONE file: `apps/web/src/generators/conway.ts`
Export `createConway(): Generator`
- Include a 2-second spin-up eased ramp
- Include colorA / colorB color params (no hue ranges)
- Schema-driven params that auto-build sliders in the Tweak panel
- Category: "cellular-automata"

Do NOT modify registry.ts or any other file. The integrating turn will
handle that after all agents return.

## Report back
Return the file content + a 1-2 sentence formula explanation for the About tab.

## Time budget
15 minutes. Draft PR if you don't finish.
```

After all agents return, you run one integrating turn that adds each new
entry to `GENERATOR_META` and `LOADERS` in `registry.ts`. Agents never
touch the aggregator file — that's where conflicts happen.

---

## The Jedi Council

Five voices. One job: find the delta between where the product is now and where
the money and impact are. The CEO (you) decides. The council generates
productive friction — not consensus.

**Convene when:** feature decisions, monetization, launch timing, stack choices,
legal exposure, "should we build this at all."

**Skip when:** pure implementation, bug fixes, style choices. If it's "how do
we build X," skip to the agent brief.

### The five seats

| Seat | Owns | Pushes back on |
|---|---|---|
| **Builder** | Technical feasibility, stack tradeoffs, debt | "Just add it" — scope creep and underestimated complexity |
| **Profit** | Unit economics, margin, pricing, payback | Spend without measurable return; underpriced products |
| **Player** | User experience, delight, friction points | Trading UX for short-term revenue |
| **Shield** | Legal, compliance (COPPA, GDPR, app store), IP, downside risk | Anything touching minors, payments, or user data without review |
| **Signal** | Discovery, narrative, data, how people find this | Shipping without a story; ignoring what the numbers say |

### Response format (always this structure)

**BLUF** — One paragraph. The decision, why it matters, bottom-line recommendation.

**The Council** — Each seat: one punchy take + support / oppose / conditional. Pass if nothing to add — no filler.

**The Crux** — Real disagreements only. One line: "[Seat] vs [Seat]: what's at stake."

**Your Call** — CEO-only decisions. Table: Decision | Option A | Option B | Lean | Easy/Split/Hard.

**If I Were CEO** — Specific action, one metric to watch, one watch-out.

### Rules

- Every recommendation traces to: **Cost Savings | Revenue Growth | User Impact**
- No manufactured conflict — agreement is valid, say so and move on
- Name the data — cite real metrics or named precedents
- Easy calls get labeled
- Missing context → flag as "Need from CEO" in Your Call, don't invent

### How to invoke

Describe the decision in Cowork: *"Should we add subscriptions on top of the
one-time purchase — convene the council."* The council pulls context from
CLAUDE.md and STRATEGY.md automatically. Add project-specific context to
CLAUDE.md so the council always has current numbers.

---

## Specialized agent roles

For complex projects, define role-specific agents in `.agent.md` files.
This keeps agent behavior consistent across sessions and prevents role bleed.

### Product agent
**Trigger when:** planning a new feature, deciding what to build next,
evaluating user benefit vs. effort, defining a roadmap.

```markdown
---
name: [project]-product
description: "Use when you need to clarify the problem, define user outcomes,
and prioritize implementation. Focuses on WHY we build, not HOW."
---
```

### Architect agent
**Trigger when:** designing architecture for a feature, choosing a library
or framework, coordinating work across multiple files or apps, identifying
technical risk.

```markdown
---
name: [project]-architect
description: "Use when you need technology decisions, system design, or
cross-app coordination. Defines structure before implementation begins."
---
```

### Engineer agent
**Trigger when:** writing code, fixing bugs, refactoring, performing code
review, implementing something already fully specced.

```markdown
---
name: [project]-engineer
description: "Use when you need code written, bugs fixed, or features
implemented. Translates product/architect decisions into working code."
---
```

### QA agent
**Trigger when:** expanding test coverage, writing regression test plans,
stress-testing a specific feature, identifying edge cases.

```markdown
---
name: [project]-qa
description: "Use when you need test scenarios, regression plans, smoke
tests, or end-to-end validation. Digs into failure modes."
---
```

### Tutor agent (the hidden gem)
A project-specific agent that serves as a living cheatsheet. Knows the
project's exact run commands, port assignments, test journeys, and common
failure modes. Paste it into any new session to get oriented instantly.

```markdown
---
name: [project]-tutor
description: "Interactive cheatsheet for this project. Knows run commands,
local URLs, Chrome testing steps, and how to capture + report issues."
---

# [Project] Tutor

## Run locally
[exact commands]

## Local URLs
[port map]

## Chrome testing checklist
1. Open target URL in Chrome
2. DevTools > Network → verify API calls succeed
3. Check console for errors
4. Validate UI flows end-to-end

## Feedback template
- Date:
- Feature tested:
- Steps taken:
- Outcome:
- Issue details:
- Suggested fix:
- AI feedback: [what the agent should have done differently]

## Known issues as of [date]
[list]
```

---

## CLAUDE.md hygiene — keep it lean

**Hard limit: 150 lines.** Beyond that, instruction-following quality degrades
measurably. Claude starts missing rules buried in long files. Shorter, focused
CLAUDE.md = better agent behavior. This is not a guideline — it's a quality gate.

### What belongs in CLAUDE.md

- Last session + Pick up here (mandatory, always current)
- Stack table (rarely changes)
- Key invariants — the rules agents break most often
- Entry points — so agents know where to start reading
- Active tech debt — things agents must not make worse right now

### What to remove

- Resolved tech debt → it's in the commit message, delete it here
- Old session blocks beyond 2 sessions → git history is the archive
- Verbose explanations of why decisions were made → that's DECISION_LOG.md
- Implementation details obvious from reading the code → agents can read code

### Monthly pruning ritual

```sh
wc -l CLAUDE.md   # if > 150, it's pruning time
```

Ask: "Does an agent need this right now to avoid breaking the project?"
If not — delete it. The goal is a file an agent reads in 30 seconds and
retains every rule. Length is the enemy of retention.

### The session log pattern

"Last session / Pick up here" is the highest-value part of CLAUDE.md:
- Update it at the **end** of every session, not the start
- "Pick up here" must be specific enough for someone cold to start immediately
- Max 3 pick-up items — if there are more, prioritize ruthlessly
- Move the previous "Last session" to "Prior session" (keep 2 max, delete older)

---

## MCP (Model Context Protocol) strategy

MCP is how agents talk to your real data — Supabase, PostHog, GitHub, app store
metrics — without you copy-pasting context into every session. As of 2026 it's
the de-facto standard (10,000+ public servers, built into Claude Code natively).

### What MCP unlocks

Without MCP: you describe what the data looks like.
With MCP: the agent queries it directly.

The council session that says "PostHog shows day-7 retention dropped 12%"
is far more actionable than "retention seems lower recently."

### When to build a custom MCP server

Build one when you catch yourself doing the same copy-paste in every session:
- Pasting analytics numbers before every product decision
- Pasting database schemas before every architecture question
- Pasting app store reviews before every council session

That repetition is a signal. An MCP server eliminates it permanently —
and the institutional knowledge it accumulates becomes a compounding moat.

### Standard connectors to wire first (priority order)

1. **GitHub** — agents read PRs, issues, and CI status directly
2. **Supabase** — schema-aware queries; council sessions use live data
3. **PostHog / Plausible** — real metrics in every product decision
4. **App store / itch.io reviews** — player sentiment in council sessions

### Minimal custom MCP server (TypeScript, ~50 LoC)

```typescript
// mcp-server/index.ts
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

const server = new McpServer({ name: "[project]-mcp", version: "1.0.0" });

server.tool("get_metrics", "Fetch key product metrics", {}, async () => {
  // query Supabase or PostHog here
  return { content: [{ type: "text", text: JSON.stringify(metrics) }] };
});

const transport = new StdioServerTransport();
await server.connect(transport);
```

Wire to Claude Code via `.claude/settings.json` (gitignored):
```json
{
  "mcpServers": {
    "[project]": {
      "command": "npx",
      "args": ["tsx", "mcp-server/index.ts"]
    }
  }
}
```

Document capabilities in `mcp-server/README.md`. Treat the MCP server like a
product — it's the proprietary tool layer that generic agents don't have.

### Future: MCP as competitive moat

Your custom MCP server accumulates project-specific intelligence over time —
schemas, metric definitions, business rules, historical context. The longer you
run it, the smarter your agents become relative to competitors using vanilla
tooling. This is a compounding advantage that doesn't show up on a feature list.

---

## Monitoring running agents

Agents write a full JSONL transcript to disk as they work. On Windows:

```powershell
# Find transcript files for the current project
$transcriptDir = "$env:TEMP\claude\C--Users-johnk-projects-[project-name]"
Get-ChildItem "$transcriptDir\*\tasks\" -Filter "*.output"

# Follow a specific agent live (like tail -f)
Get-Content -Path "<path-to>.output" -Wait -Tail 20
```

**What you'll see:** every tool call, every file read, every edit, every
model response — as it happens.

**Don't panic at silence.** Agents go quiet for 30–60 seconds during
model thinking steps. New events appear as soon as the next tool call fires.
A silent agent is not a hung agent. Give it 90 seconds before worrying.

**To filter for just the agent's prose** (ignore raw tool payloads):
```powershell
Get-Content "<path>.output" -Wait | Select-String '"type":"text"'
```

---

## Merge conflict resolution pattern

Template and aggregator PRs often conflict on shared files (e.g.,
`src/templates.ts` that imports from many modules). The resolution is
always mechanical — both sides are right, keep both:

```bash
git fetch origin main
git rebase origin/main

# For each conflicted file: keep both sides
# (add new imports above existing; add new spreads into the array)

# If rebase blocks on an unrelated modified file:
git stash push -- path/to/unrelated/file.md
git rebase --continue
git stash pop

git push --force-with-lease origin <branch>
```

---

## Reviewing agent PRs — checklist

Before merging any agent PR:

- [ ] Diff is scoped — agent didn't touch files outside its brief
- [ ] No new `console.log` or debug code
- [ ] No hardcoded secrets, API keys, or PII
- [ ] Tests added or updated alongside the feature
- [ ] No `any` in TypeScript
- [ ] PR description explains what was built

After merging: immediately run the daily startup ritual to confirm main is
green.

---

## Core engineering rules (project-agnostic)

These apply in every agent brief unless you explicitly override them.
Paste them into briefs as a reminder when the domain is unfamiliar.

```
- TypeScript strict mode — no `any`, ever.
- Check `res.ok` before calling `res.json()` on every fetch.
- Guard array payloads with `Array.isArray()` before iterating.
- Use stable keys for list rendering (use `item.id`, never array index).
- No hardcoded copy in components — strings belong in constants.
- No inline magic numbers — name every threshold and limit.
```

---

## Anthropic API from the browser — it won't work

Calling `api.anthropic.com` directly from browser JavaScript fails.
Anthropic requires server-side auth; the CORS preflight is rejected.

**Options when you need AI in the client:**
- **Prebake:** run prompts in Claude.ai, paste JSON output into a
  `DEFAULT_AI_CONTENT` constant. Zero infra, works offline.
- **Server proxy:** add a Cloudflare Worker or Vercel Edge Function
  (~30 LoC) that forwards `/api/generate` → Anthropic with the key
  in a server-side env var.
- **Supabase Edge Function:** same pattern, closer to your existing stack.

---

## Port conflict cleanup (Windows)

When a dev server crashes and the port is stuck:

```powershell
# Find what's using a port
Get-NetTCPConnection -LocalPort 5173 | Select-Object LocalPort,OwningProcess

# Kill it
Stop-Process -Id <PID> -Force
```

For monorepos running multiple ports at once:
```powershell
Get-NetTCPConnection -LocalPort 3002,5173,5174,5175,5176 `
  | Select-Object LocalPort,OwningProcess
Stop-Process -Id <PID> -Force  # repeat per PID
```

---

## GitHub + CLI quick-reference

```bash
# Check if a PR is mergeable (wait 5s after a force-push — GitHub lags)
sleep 5 && gh pr view <number> --json mergeable

# Merge with squash
gh pr merge <number> --squash

# Create PR from current branch
gh pr create --head <branch> --title "feat: description" --body ""

# List open PRs
gh pr list
```

---

## Lessons learned (updated as you go)

**From webbyspin:**
- `gh pr view N --json mergeable` lags by 5–10s after a force-push.
  Always `sleep 5` before checking mergeability.
- Worktree agents on the same repo CAN co-exist cleanly — five at once
  shipped with zero cross-stomping. The key: each agent knows exactly which
  files it owns and touches nothing else.
- Hard time budgets in every brief prevent silent hangs. "Stop at 20
  minutes" caught zero hangs across a marathon parallel session.
- `git rebase --continue` can block on an unrelated modified file even
  after all conflict markers are resolved. `git stash push -- file.md`
  first, then `--continue`.

**From mango-grove:**
- `.env` and `node_modules` do NOT inherit into git worktrees. Both must be
  set up manually in each worktree. Forgetting this is the #1 cause of
  "agent fails immediately with a missing module/env error."
- Copilot session rate limits hit without warning and reset on a fixed
  schedule. If Copilot is central to your workflow that day, start early
  and track the reset time.
- Multi-AI collaboration works best with hard role separation. When Claude,
  Copilot, and another tool are all touching the same codebase without
  clear ownership, they stomp each other. Assign one tool per concern.
- A Tutor agent (project cheatsheet as an .agent.md) lets you orient a
  new session in under 60 seconds. Worth the 20-minute investment upfront.

**From veg3D:**
- For parallel generator/template work: scope each agent to exactly one
  output file. The aggregating merge (registry.ts, templates.ts, etc.)
  is ALWAYS done in a single human-driven turn after all agents return.
  Never let agents touch aggregator files — that's where conflicts pile up.
- A "report back" spec in the brief (what content to return, in what format)
  lets you batch-process the integrating turn without re-reading each
  agent's implementation detail.

**From vibecode setup.md:**
- Agent silence during thinking steps is normal. 30–60 seconds of no
  output is NOT a hang. 90+ seconds with no new events is worth a check.
- Local LLM via Ollama can proxy as Anthropic API for free/offline work.
  Set `ANTHROPIC_BASE_URL=http://localhost:11434/v1` and use
  `qwen2.5-coder:7b` (or `32b` with 24GB+ VRAM) for coding tasks.
  Not a replacement for real Claude on complex reasoning — but useful for
  quick edits when you're offline or rate-limited.

**From upgrading to Claude Max + Cowork (2026-05):**
- Voice-driven Cowork sessions are the new planning layer. Narrate intent;
  Claude orchestrates. The brief becomes the contract passed to Claude Code.
- Gemini in Chrome handles parallel research without interrupting an active
  Cowork session. Bring findings back rather than switching context mid-session.
- The Executive Council pattern scales to any project. Configure which seats
  are active in CLAUDE.md — a solo indie game needs CTO + Product + Legal at
  minimum; a B2B SaaS needs Finance + CISO too. Drop seats that don't apply
  rather than having them manufacture filler.
- Copilot is now supplementary, not primary. Claude Code + Cowork covers most
  of what Copilot was doing. Keep Copilot for inline autocomplete in VS Code
  when you want your hands on the keyboard.
- The self-healing CI goal: tests run on every PR, failures block merge,
  flaky tests get flagged automatically. Observable = you know the system
  is healthy without manually checking.
- Spec-driven development (spec session → implementation session) is the single
  biggest quality improvement available. The discipline of writing the spec
  before touching any code surfaces half the bugs before they're written.
- CLAUDE.md files degrade with length. 150-line cap is a quality gate, not
  a suggestion. The best CLAUDE.md is the shortest one that prevents agents
  from making the most common mistakes in that project.
- MCP server development is now standard practice, not advanced. Wire the
  four standard connectors (GitHub, Supabase, analytics, app store) early.
  Every hour of MCP setup eliminates hours of copy-paste across sessions.

---

## The compounding flywheel — building toward scale

_This section is about the big picture: how the workflow above compounds into
a durable competitive advantage._

### Why AI-native teams win

The advantage isn't that AI writes code faster (though it does). The advantage
is **iteration speed compounds**. A team shipping 3 features/week instead of
3 features/month gets 4x more user feedback, 4x more signal on what to build
next, and 4x more chances to be right. Over 12 months, that gap doesn't add —
it multiplies.

The template, the council, the spec discipline, the MCP servers, the eval loops
— each one is a multiplier on iteration speed. Stack them.

### The four compounding moats

1. **Context moat** — your CLAUDE.md files, specs, and DECISION_LOG accumulate
   institutional knowledge that new agents can absorb instantly. A competitor
   starting from zero today is months behind on context alone.

2. **Data flywheel** — every user interaction, logged and reviewed, makes the
   next AI output better. This is described in detail in `LLM_OPS.md`. The team
   that starts logging in week 1 is 6 months ahead of the team that starts in
   month 6. That gap doesn't close.

3. **MCP moat** — your custom MCP servers encode domain knowledge — schemas,
   business rules, metric definitions — that generic agents don't have. The
   longer you run them, the smarter your agents become relative to vanilla tooling.

4. **Process moat** — the spec → brief → worktree → PR → review cycle runs
   faster with every iteration because the template gets more precise. Teams
   that never systemize their process restart from chaos every project.

### Stage-gated investments

Build infrastructure when you hit the trigger — not before, not never.

| Stage | Trigger | What to add |
|---|---|---|
| **0 → first users** | Day 1 | This template, CLAUDE.md, CI, basic logging |
| **First users → $1K MRR** | First paying user | LLM call logging, cost alerts, 👍/👎 feedback |
| **$1K → $10K MRR** | 50 DAU | Automated evals in CI, Langfuse for observability |
| **$10K → $100K MRR** | 500 DAU | A/B prompt testing, RAG if users ask about own data, MCP server for live council sessions |
| **$100K MRR+** | Team of 3+ | Dedicated ML/data role, fine-tuning conversations, multi-model routing |

**The trap:** building $100K infrastructure on Day 1. The goal is to be
infrastructure-light early and add exactly the right layer at exactly the right
time. The template gives you the foundation. The flywheel does the rest.
