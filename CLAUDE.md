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

## Last session — 2026-05-09 (v1.1 updater: shipped)

### What shipped (v1.1)

- `tauri-plugin-updater` wired end-to-end: Rust registration, capabilities, `tauri.conf.json` pubkey + endpoint
- `<UpdateToast>` bottom-right toast: available / downloading (%) / stalled (60s) / error states
- Launch check fires 5s after mount; `window.blur` autosave flush before install; session suppression for "Later"
- Settings modal (⚙) shows `margin vX.Y.Z` + **Check for updates** link; manual recheck bypasses suppression
- `.github/workflows/release.yml` — builds signed MSI + `latest.json` on `v*` tag push → draft GitHub Release
- 30 tests passing, `typecheck` clean

### Pick up here

- **Cut the first release:** bump version in `tauri.conf.json` + `Cargo.toml` → commit → `git tag v0.0.2 && git push origin main --follow-tags`
- Monitor workflow at `https://github.com/jckilfoil-spec/margin/actions`; promote draft release → installed v0.0.1 sees the update toast
- Next feature: v2 (search across notes, tags — see SPEC.md)

---

## Architecture

A personal desktop notepad: paper-style ruled background, satisfying chunky checkboxes, local Markdown files. Single-user, no backend.

### Stack

| Layer | Choice |
|---|---|
| Shell | Tauri 2 (Rust) |
| Frontend | React + TypeScript (strict) + Vite |
| Styling | CSS variables, no framework |
| Editor | TipTap (ProseMirror) |
| Storage | Local `.md` files via `tauri-plugin-fs` |
| State | React `useState` + `zustand` |
| Tests | Vitest (frontend) + cargo test (Rust) |

### Entry points

- `src-tauri/src/lib.rs` → Tauri builder: plugin registration + all `invoke_handler` commands
- `src-tauri/src/config.rs` → `get_journal_dir` / `set_journal_dir` (read/write `config.json`)
- `src-tauri/src/journal.rs` → all filesystem commands + sections CRUD + `append_page` (atomic, `O_CREAT|O_EXCL`)
- `src/App.tsx` → top-level layout; owns autosave state machine (debounced 500ms + `window.blur` flush)
- `src/store.ts` → zustand: `journalDir`, `activePath`, `refreshKey`, `editor`, `updateAvailable`, `dismissedVersions`, `flushAutosaveNow`
- `src/lib/config.ts` → frontend wrapper for `get_journal_dir` / `set_journal_dir` Tauri commands
- `src/lib/storage.ts` → Tauri `fs` plugin wrapper (read/write/list `.md` files)
- `src/lib/dates.ts` → date utilities for file naming and sidebar grouping
- `src/lib/updater.ts` → thin wrapper over `@tauri-apps/plugin-updater`: `checkForUpdate()`, `installUpdate(onProgress)`
- `src/components/UpdateToast.tsx` → bottom-right toast: available / downloading / stalled states
- `src/components/FolderPickerModal.tsx` → first-launch folder picker modal
- `src/components/EditField.tsx` → inline rename input (sidebar section rename)

### Data flow

1. Rust reads `<app_config_dir>/margin/config.json` for `journalDir`; missing → `FolderPickerModal`.
2. Sidebar lists `*.md` at `journalDir` root ("Daily") + each subdirectory as a named section.
3. Edits debounce-save to disk every 500ms; also flushed on `window.blur`.

**Non-obvious coupling:** `src/store.ts` holds `editor: Editor | null` — the live TipTap instance. `PromptButton` reads this ref directly to insert a blockquote at the cursor, bypassing props entirely.

**Sections vs Daily:** Sections are subdirectories under `journalDir`. Pages follow `<base>.md` / `<base>_NN.md`, allocated atomically by `append_page` (`O_CREAT|O_EXCL`).

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
npm run tauri dev          # desktop app dev mode (hot-reload)
npm test                   # vitest run (single pass)
npm run test:watch         # vitest watch mode
npx vitest run src/path/to/file.test.ts  # single test file
npm run typecheck          # tsc --noEmit (must be clean before any PR)
npm run lint               # eslint
npm run format             # prettier --write
npm run tauri build        # full signed installer → src-tauri/target/release/bundle/
cd src-tauri && cargo test # Rust unit tests
```

Pre-flight before spawning agents: `npm test && npm run typecheck` must both exit 0.

---

## Conventions

- Files: `kebab-case.ts` / `PascalCase.tsx`; CSS tokens: `--category-name`; CSS classes: `kebab-case` with feature prefix (`paper-`, `cb-`, `sb-`, `um-`, `pb-`, `tu-`)
- Components: soft cap 300 lines, hard cap 600; one test file per source file, beside it
- Commits: `type(scope): description`; branches: `feat/<name>` · `fix/<name>` · `docs/<name>`
- Effort estimates: T-shirt sizes (XS/S/M/L/XL) with one-line reason. Never durations.

---

## AI agent rules

See **AGENTS.md** for the full workflow. Sub-agents MUST NOT modify `CLAUDE.md`, `AGENTS.md`, `SPEC.md`, `HANDOFF.md`, or `DESIGN.md`.
