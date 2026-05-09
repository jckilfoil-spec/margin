# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Session guide for **margin**. Updated at the end of every session.
Read this file first, every time, before touching any code.

> **First time picking this up?**
> 1. Read **SPEC.md** — the v1 contract.
> 2. Read **HANDOFF.md** — the sequencing + library choices.
> 3. Read **DESIGN.md** — paper aesthetic + chunky-checkbox spec.
> 4. Read the **Last session** block below.

---

## Last session — 2026-05-08 (spec written in Cowork; ready for Claude Code handoff)

### What shipped

- Project scaffold copied from `_template`
- SPEC.md written and signed off
- HANDOFF.md generated with three-PR sequencing for Claude Code
- DESIGN.md updated with paper aesthetic + chunky-checkbox spec
- README.md customized for the Tauri stack

### Decisions made

- **Tauri over Electron** — lightweight footprint matters for a daily-use scratchpad
- **Local Markdown files** over a database — portable, future-proof, no lock-in
- **TipTap** as the editor — mature, ProseMirror-backed, has Task List + Markdown extensions
- **No Tailwind** — paper aesthetic needs hand-tuned CSS tokens
- **Reflection prompts on-demand** (not daily auto-insert) — respects flow
- **Folder picker on first launch** — most flexible storage location
- **No dark mode in v1** — single aesthetic, ship faster

### Pick up here next session

1. Hand the brief at the bottom of HANDOFF.md to Claude Code
2. Review PR 1 (Tauri scaffold) when it lands — confirm window opens with paper background
3. After all 3 PRs land, smoke-test the chunky-checkbox feel and budget time to polish if it doesn't satisfy

---

## Architecture

### What this is

A personal desktop notepad with paper-style ruled background and big satisfying
checkboxes. Single-user, local-only, no backend. Each note is a Markdown file
in a folder the user picks on first launch. The signature interaction is the
checkbox: tapping it draws a check mark that intentionally extends past the
box bounds.

### Stack

| Layer | Choice | Why |
|---|---|---|
| Shell | Tauri 2 (Rust) | ~10MB installer, native feel, low memory |
| Frontend | React + TypeScript (strict) + Vite | Fast iteration |
| Styling | CSS variables, no framework | Custom paper aesthetic |
| Editor | TipTap (ProseMirror) | Mature, has the right primitives |
| Storage | Local `.md` files via `tauri-plugin-fs` | Portable, no lock-in |
| State | React `useState` + small `zustand` store | No Redux |
| Tests | Vitest (frontend) + cargo test (Rust) | Standard |
| Deploy | Local install only | No backend |

### Entry points

- `src-tauri/src/main.rs` → Tauri app boot, plugin registration, config commands
- `src/main.tsx` → React mount
- `src/App.tsx` → Sidebar + PaperEditor + UserMenu layout

### Data flow

1. On launch, Rust reads `<app_config_dir>/margin/config.json` for `journalDir`.
2. If missing, frontend shows folder-picker modal; user choice writes back to config.
3. Frontend lists `*.md` files in `journalDir` for the sidebar.
4. Today's file is opened (or created) and parsed into TipTap doc state.
5. Edits debounce-save back to disk every 500ms via `tauri-plugin-fs`.

### Key invariants

1. **Checkboxes are 24×24px minimum.** Never shrink them. Ever.
2. **The check mark must extend past the box bounds when toggled.** That overflow IS the feature.
3. **All notes are plain Markdown files.** No proprietary format, no database.
4. **No telemetry, no network calls, no accounts.** This is a personal tool.
5. **The User menu lives in the bottom-left.** Project-wide convention.
6. **No `any` in TypeScript.** Strict mode.

---

## Commands

```sh
npm run tauri dev          # launch the desktop app in dev mode (hot-reload)
npm test                   # vitest (frontend unit tests)
npm run typecheck          # tsc --noEmit (must be clean before any PR)
npm run lint               # eslint
npm run format             # prettier --write
npm run build              # vite build (frontend only)
npm run tauri build        # full signed installer → src-tauri/target/release/bundle/
cd src-tauri && cargo test # Rust unit tests
```

Pre-flight before spawning agents: `npm test && npm run typecheck` must both exit 0.

---

## Conventions

### Naming

- Files: `kebab-case.ts` / `PascalCase.tsx` for components
- CSS tokens: `--category-name`
- CSS classes: `kebab-case`, feature-prefixed (`paper-`, `cb-`, `sb-`, `um-`, `pb-`)

### File size limits

- Components: soft cap 300 lines, hard cap 600
- Test files: one per source file, lives beside it

### Commits

`type(scope): description` — e.g. `feat(checkbox): add overflow draw animation`

### Branch naming

`feat/<short-name>` · `fix/<short-name>` · `docs/<short-name>`

### Effort estimates

T-shirt sizes (XS / S / M / L / XL) with one-line reason. Never durations.

---

## AI agent rules

See **AGENTS.md** for the full workflow. Short version:

- Spec is in SPEC.md — that's the contract
- HANDOFF.md has the three-PR sequencing for Claude Code
- Every agent gets a 45-minute time budget per PR
- Every agent works in an isolated worktree
- Every agent output lands as a PR — review before merge
- Sub-agents MUST NOT modify `CLAUDE.md`, `AGENTS.md`, `SPEC.md`, `HANDOFF.md`, or `DESIGN.md`
