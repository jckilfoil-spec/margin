# HANDOFF: margin v1 → Claude Code

> Paste the brief at the bottom of this file into Claude Code to start the
> implementation session. SPEC.md is the contract — read it first.

---

## Recommended sequencing

The agent should land v1 in **three PRs**, not one. Each PR is small enough to
review in 15 minutes and fail safely.

### PR 1 — Tauri scaffold (size: S)
- `npm create tauri-app@latest .` → React + TypeScript template
- Strip the boilerplate "Welcome to Tauri" UI down to an empty layout
- Wire `style.css` with the design tokens from `DESIGN.md`
- Add `tauri-plugin-fs` and configure scoped filesystem access
- Stub out config read/write in `src-tauri/src/config.rs`
- **Acceptance:** `npm run tauri dev` opens an empty paper-colored window

### PR 2 — Paper editor + storage (size: M)
- `<PaperEditor>` using TipTap with StarterKit + Markdown extension
- Ruled-paper background (CSS gradient + `background-size`) aligned to
  TipTap's line-height
- `lib/storage.ts` reads/writes `YYYY-MM-DD.md` from the journal folder
- First-launch folder picker modal
- Today's page auto-opens
- Autosave debounced at 500ms
- **Acceptance:** typing persists to disk; reopening loads today's page

### PR 3 — Chunky checkbox + sidebar + prompts (size: M)
- Custom TipTap node view for `[ ]` / `[x]` task list items
- 24×24 box, animated check that overflows by 4px each side
- `<Sidebar>` lists `YYYY-MM-DD.md` files newest-first, grouped by month
- `<PromptButton>` in the bottom-left next to the user menu
- `src/prompts.ts` with ~30 reflection prompts
- **Acceptance:** all SPEC.md acceptance criteria pass

---

## Library decisions (don't re-litigate)

| Need | Choice | Why |
|---|---|---|
| Editor | **TipTap** | Mature, ProseMirror-backed, has Task List + Markdown extensions |
| Markdown serialization | `tiptap-markdown` | Round-trips cleanly enough for our scope |
| Date handling | `date-fns` (light) | Sidebar grouping; no need for moment/dayjs |
| Tauri filesystem | `tauri-plugin-fs` v2 | Scoped to journal dir for safety |
| Icons | `lucide-react` | Consistent w/ John's other projects |
| State | React `useState` + a tiny store via `zustand` | No Redux; no Context-soup |

**Do NOT add:** Tailwind (we want hand-tuned paper CSS), shadcn (overkill),
Electron (we picked Tauri), a database (filesystem is the database).

---

## Reflection prompts (seed list, ~30)

These belong in `src/prompts.ts` as a typed `string[]`. They're pulled at
random by the prompt button.

```ts
export const PROMPTS = [
  "What's draining your energy this week?",
  "What did you learn yesterday that surprised you?",
  "If you only do one thing today, what would matter most?",
  "What's a decision you've been postponing? Why?",
  "Who in your life have you not thanked recently?",
  "What does your future self need from you right now?",
  "What's a belief you held last year that you no longer hold?",
  "Where are you spending time that doesn't compound?",
  "What's one thing that felt heavy this week — and is it still heavy?",
  "What would you build if you couldn't fail?",
  "When did you last feel proud of yourself? What for?",
  "What's the smallest version of your big idea?",
  "Who's living the life you want — what are they doing differently?",
  "What's a problem you keep trying to think your way out of?",
  "What's something you've been avoiding writing down?",
  "If you had a free hour today, where would it go?",
  "What's your relationship with rest right now?",
  "What's a recurring frustration — and what's the root cause?",
  "What did your body tell you today that you ignored?",
  "What's a goal you've outgrown but haven't released?",
  "Who deserves a 'thinking of you' message right now?",
  "What's the next 10% on the project you care most about?",
  "What did you say yes to this week that you should've declined?",
  "What's a small win from yesterday worth re-noticing?",
  "If today were a chapter title, what would it be?",
  "What's making you feel alive lately?",
  "What's a question you've been afraid to ask?",
  "Who do you want to be in five years — and what would they do today?",
  "What's a story you're telling yourself that might not be true?",
  "What would you do if you trusted your instincts more?",
];
```

---

## Acceptance bar (Definition of Done for v1)

Every item in `SPEC.md → Acceptance criteria` must pass. Plus:

- App launches cold in <2s on John's dev machine
- No `any` in TypeScript, no `console.log` left in
- README quickstart commands work on a fresh clone
- The check mark visibly extends past the checkbox border (this is the
  signature interaction; budget time to make it feel right)

---

## The brief — paste this into Claude Code

```
## Context
You are implementing margin v1 — a personal paper-feel notepad with chunky,
satisfying checkboxes. The full spec is in SPEC.md at the repo root. Read
it before writing any code. The supporting files HANDOFF.md (sequencing +
library choices), DESIGN.md (tokens + checkbox visual spec), and CLAUDE.md
(architecture + invariants) are also at the repo root.

Stack: Tauri 2 (Rust shell) + React + TypeScript + TipTap. No Tailwind.
No backend. Local Markdown files only.

## Task
Implement margin v1 in three sequential PRs as described in HANDOFF.md
"Recommended sequencing":
  1. Tauri scaffold + design tokens
  2. Paper editor + storage + autosave + first-launch folder picker
  3. Chunky checkbox + sidebar + reflection prompts

## Acceptance criteria
Every item under "Acceptance criteria" in SPEC.md must pass before declaring
v1 done. Plus the v1 Definition of Done in HANDOFF.md.

## Time budget
Stop at 45 minutes per PR. If you haven't pushed a commit by then, open a
draft PR describing what's done and what's left, then STOP. Three PRs total
across three sessions, not one mega-PR.

## Off-limits
- Do NOT modify CLAUDE.md, AGENTS.md, RUNBOOK.md, SPEC.md, DECISION_LOG.md,
  or HANDOFF.md
- Do NOT add Tailwind, shadcn/ui, or a backend
- Do NOT use `any` in TypeScript
- Do NOT add features outside the SPEC (search, tags, dark mode, etc. are v2)
- Do NOT shrink the checkboxes. Ever.
```
