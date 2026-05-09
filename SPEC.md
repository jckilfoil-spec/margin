# SPEC: margin v1

**Date:** 2026-05-08
**Status:** [x] Draft → [x] Ready → [ ] In implementation → [ ] Done
**Branch:** `feat/v1-scaffold`
**Agent brief generated:** [x] Yes (see HANDOFF.md)

---

## Problem

John doesn't have a daily scratchpad that fits the way he actually thinks on
paper. Existing tools (Notion, Apple Notes, Obsidian, Teams) either feel
corporate, lock data into proprietary formats, or — most painfully — keep
shrinking their checkboxes. He wants a personal canvas that looks like ruled
paper, lets him check things off with a satisfying chunky tick, and writes
plain Markdown to a folder he owns.

---

## Not in scope (v1)

- Multi-device sync (no iCloud, no Dropbox integration baked in — user can
  point the storage folder at one if they want)
- Search across all notes (will live in v2 once there are >20 notes)
- Tags / categories (v2)
- Multi-user / collaboration / sharing
- Mobile or web versions
- Drawing, sketching, image embeds
- Export to PDF / print styling
- Theming beyond the single "modern paper" look (no dark mode for v1)
- Linking between notes ([[wikilinks]])
- Plugins / extensibility

---

## User flow

1. **First launch.** App opens. Modal asks "Where should your journal live?"
   with a folder picker and a default suggestion of `~/Documents/margin/`.
   User chooses; choice is persisted in app config.
2. **Today's page opens.** If `YYYY-MM-DD.md` doesn't exist in the folder,
   it's created with a date header and an empty cursor on line 1.
3. **User writes.** Typing renders Markdown live (bold, italic, headers,
   lists). The page looks like ruled paper — soft off-white background,
   faint horizontal rules every line of text, subtle red margin line on the
   left.
4. **User adds a checklist.** Typing `- [ ] task` (or pressing the checkbox
   button in a minimal toolbar) inserts a chunky checkbox.
5. **User clicks a checkbox.** The check mark draws in with a brief animation
   (~200ms), and the check intentionally extends past the box edges. The
   line gets a subtle strikethrough.
6. **User wants a prompt.** User clicks "Ask me something" in the bottom-left.
   App inserts a reflection prompt (e.g., "What's draining your energy this
   week?") at the cursor as a Markdown blockquote.
7. **User navigates back in time.** A collapsible left sidebar lists prior
   days (newest first, grouped by month). Click a date → its file opens.
8. **User closes the app.** All edits are autosaved continuously (debounced,
   ~500ms after last keystroke). Nothing to "save."

---

## Acceptance criteria

- [ ] First-launch folder picker appears and persists the choice to app config
      (Tauri `app_config_dir`).
- [ ] On launch (after first run), today's page opens automatically. If the
      file for today doesn't exist, it's created with `# YYYY-MM-DD` as the
      first line.
- [ ] Typing in the editor renders Markdown live (bold via `**`, italic via
      `*`, h1/h2/h3 via `#`/`##`/`###`, unordered lists via `-`, ordered via `1.`).
- [ ] The editor visually resembles ruled paper: off-white background
      (`--paper`), faint horizontal rules at every text baseline (`--rule`),
      a subtle red vertical margin line ~80px from the left (`--margin`).
- [ ] Checkboxes rendered for `- [ ] ` and `- [x] ` lines are at least 24×24px.
- [ ] Clicking a checkbox toggles its state, animates the check mark drawing
      in over ~200ms, and the rendered check extends visibly outside the
      box bounds (intentional overflow). The underlying Markdown updates
      from `[ ]` to `[x]` and back.
- [ ] Bottom-left has an "Ask me something" button that, when clicked, inserts
      a reflection prompt at the cursor as a Markdown blockquote
      (`> Prompt: …`). Prompts come from a static array of ~30 in
      `src/prompts.ts`.
- [ ] Left sidebar lists prior days, newest first, grouped by month.
      Clicking a date opens that file.
- [ ] Autosave fires ~500ms after the last keystroke. Closing the app loses
      no data.
- [ ] User menu placeholder lives in the **bottom-left** of the main window
      (per project-wide convention) — for v1 it just renders a settings cog
      that opens an "About / change journal folder" modal.
- [ ] `npm test` exits 0 and `cd src-tauri && cargo test` exits 0.
- [ ] `npm run typecheck` is clean (no `any`).
- [ ] App launches in under 2 seconds on John's dev machine.

---

## Edge cases

- **First launch, user closes the folder picker without choosing.** App
  re-opens the picker on next launch. Don't proceed without a folder.
- **Chosen folder is read-only or vanishes.** Show a toast: "Can't write to
  [folder]. Pick a new location?" with a button to re-trigger the picker.
- **User edits a `.md` file outside the app, then opens that day in margin.**
  margin re-reads from disk on focus and shows the latest content. Never
  silently overwrite external edits.
- **Empty journal folder.** Sidebar shows "No prior days yet — today is day 1."
- **Date crosses midnight while app is open.** Today's page does NOT auto-swap.
  User keeps writing in the page they were on. A subtle banner offers
  "Open tomorrow's page" if they want it.
- **Checkbox tapped while autosave is pending.** Toggle is captured in app
  state immediately; serialization to disk happens via the same debounce.
- **Long line of text wraps.** Wrapped lines align to the same horizontal
  baseline rules as primary lines (no orphan rules).

---

## Data / state changes

| What | Before | After | Notes |
|------|--------|-------|-------|
| App config | — | `{ "journalDir": "<absolute path>" }` | Tauri `app_config_dir`/`config.json` |
| Journal folder | — | One `YYYY-MM-DD.md` per day | Plain Markdown |
| In-memory editor state | — | TipTap doc tree per open file | Serialized back to MD on autosave |

Filename format: `YYYY-MM-DD.md` (UTC date, so timezone moves don't create dupes).

---

## Files to touch

The Claude Code agent owns the v1 scaffold. New files only — there's nothing
to modify yet.

**Frontend (TypeScript + React):**
- `src/main.tsx` — app entrypoint
- `src/App.tsx` — top-level layout (sidebar + editor + bottom-left chrome)
- `src/style.css` — design tokens + paper aesthetic
- `src/components/PaperEditor.tsx` — TipTap-based editor with paper styling
- `src/components/ChunkyCheckbox.tsx` — custom checkbox node view (the star of the show)
- `src/components/Sidebar.tsx` — date list, grouped by month
- `src/components/UserMenu.tsx` — bottom-left settings cog + About modal
- `src/components/PromptButton.tsx` — "Ask me something" button + insertion logic
- `src/prompts.ts` — static array of ~30 reflection prompts
- `src/lib/storage.ts` — wrapper around Tauri `fs` plugin (read/write/list `.md` files)
- `src/lib/markdown.ts` — TipTap ↔ Markdown serialization helpers

**Tauri (Rust):**
- `src-tauri/src/main.rs` — app entry, `fs` plugin registration, config commands
- `src-tauri/src/config.rs` — read/write `config.json` (journal folder choice)
- `src-tauri/tauri.conf.json` — window config (1100×800 default, min 700×500)

**Off-limits:**
- `CLAUDE.md`, `AGENTS.md`, `RUNBOOK.md`, `SPEC.md`, `DECISION_LOG.md`, `HANDOFF.md`

---

## Design / UI notes

See **DESIGN.md** for the full token system. Highlights:

- **Paper:** `--paper: #fbfaf5` background, `--rule: rgba(20,50,120,0.10)`
  for horizontal lines, `--margin: rgba(180,40,40,0.28)` for the margin rule.
- **Type:** body in a humanist sans (`Inter`, fallback to system-ui) at
  `--text-body: 16px`, line-height set so each line lands exactly on a rule.
- **Checkbox:**
  - Box: 24×24px, 2px border in `--ink`, `--radius-sm` corners.
  - Check mark: SVG path that animates `stroke-dashoffset` from 100% to 0%
    over 200ms when toggled.
  - Path is sized 32×32 (i.e., 4px overflow on each side) so the check
    extends past the box bounds.
- **Spacing:** use `--space-*` tokens.
- **No dark mode in v1.**

---

## Open questions

All resolved during the spec session. Ask before deviating.

---

## Sign-off

- [x] Spec reviewed in Cowork session — no open questions remain
- [x] Acceptance criteria are specific enough to be tested by a stranger
- [x] Data changes are documented
- [x] Files-to-touch list is complete and bounded
- [x] Agent brief is generated from this spec → HANDOFF.md
- [ ] Ready to open worktree (set when handing off to Claude Code)

_The spec is the contract. If implementation diverges, update the spec first._
