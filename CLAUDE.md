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

### What shipped (v1 — complete)

- All three HANDOFF.md PRs landed: Tauri scaffold → Paper editor + storage → Chunky checkbox + sidebar + prompts
- Sidebar extended beyond original spec: user sections (subdirs), inline rename/delete via pencil icon
- Atomic page allocation in `journal.rs` (`append_page` uses `O_CREAT|O_EXCL` for concurrency safety)
- Autosave hardened: debounced at 500ms + best-effort flush on `window.blur`
- Brand icons generated from `download/png-square/margin-1024.png` via `npm run tauri -- icon`
- `margin_0.0.1_x64_en-US.msi` built and installed — app is on the machine, pinnable to taskbar

### What shipped (v1.1 — updater, PR #1 merged)

- `tauri-plugin-updater` wired end-to-end: Rust registration, capabilities, `tauri.conf.json` pubkey + endpoint
- `<UpdateToast>` bottom-right toast: available / downloading (%) / stalled (60s) / error states
- Launch check fires 5s after mount; `window.blur` autosave flush before install; session suppression for "Later"
- Settings modal (⚙) shows `margin vX.Y.Z` + **Check for updates** link; manual recheck bypasses suppression
- `.github/workflows/release.yml` — builds signed MSI + `latest.json` on `v*` tag push → draft GitHub Release
- GitHub Actions secrets added (`TAURI_SIGNING_PRIVATE_KEY` + `_PASSWORD`)
- 30 tests passing, `typecheck` clean

### Pick up here next session

- **Cut the first release:** `git checkout main && git pull` → bump version in `tauri.conf.json` + `Cargo.toml` → commit → `git tag v0.0.2 && git push origin main --follow-tags`
- Monitor the Actions workflow at `https://github.com/jckilfoil-spec/margin/actions`
- Promote the draft release → installed v0.0.1 will see the update toast
- Next feature: v2 (search across notes, tags — see SPEC.md "Not in scope" list)

### Decisions made

- **Tauri over Electron** — lightweight footprint matters for a daily-use scratchpad
- **Local Markdown files** over a database — portable, future-proof, no lock-in
- **TipTap** as the editor — mature, ProseMirror-backed, has Task List + Markdown extensions
- **No Tailwind** — paper aesthetic needs hand-tuned CSS tokens
- **Reflection prompts on-demand** (not daily auto-insert) — respects flow
- **Folder picker on first launch** — most flexible storage location
- **No dark mode in v1** — single aesthetic, ship faster
- **GitHub Releases as update host** — free, repo already public, `tauri-apps/tauri-action` handles `latest.json`
- **Ed25519 signing key** — private key at `~/.tauri/margin.key` (never commit); pubkey in `tauri.conf.json`


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

- `src-tauri/src/main.rs` → just calls `margin_lib::run()`
- `src-tauri/src/lib.rs` → Tauri builder: plugin registration + all `invoke_handler` commands
- `src-tauri/src/config.rs` → `get_journal_dir` / `set_journal_dir` commands (read/write `config.json`)
- `src-tauri/src/journal.rs` → all filesystem commands: read/write/delete files, sections CRUD (`list_sections`, `create_section`, `rename_section`, `delete_section`), `append_page` (atomic allocation)
- `src/main.tsx` → React mount
- `src/App.tsx` → top-level layout; owns autosave state machine (debounced timer + `window.blur` flush)
- `src/store.ts` → zustand store: `journalDir`, `activePath`, `refreshKey`, `editor: Editor | null`; v1.1 adds `updateAvailable`, `dismissedVersions`, `flushAutosaveNow`
- `src/lib/updater.ts` *(v1.1, new)* — thin wrapper over `@tauri-apps/plugin-updater`: `checkForUpdate()`, `installUpdate(onProgress)`
- `src/components/UpdateToast.tsx` *(v1.1, new)* — bottom-right toast: available / downloading / stalled states

### Data flow

1. On launch, Rust reads `<app_config_dir>/margin/config.json` for `journalDir`.
2. If missing, frontend shows `FolderPickerModal`; user choice writes back to config.
3. Sidebar lists `*.md` files at `journalDir` root ("Daily" group) and each subdirectory as a named section.
4. Today's file is opened (or created) and parsed into TipTap doc state.
5. Edits debounce-save back to disk every 500ms; additionally flushed on `window.blur` (covers most Windows close paths).

**Non-obvious coupling:** `src/store.ts` holds `editor: Editor | null` — the live TipTap instance. `PromptButton` reads this ref directly to insert a blockquote at the cursor, bypassing props entirely.

**Sections vs Daily:** Sections are plain subdirectories under `journalDir`. Pages inside sections follow the same `<base>.md` / `<base>_NN.md` naming convention, allocated atomically by the `append_page` Rust command (`O_CREAT|O_EXCL`).

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
npm test                   # vitest run (frontend unit tests, single pass)
npm run test:watch         # vitest watch mode
npx vitest run src/path/to/file.test.ts  # run a single test file
npm run typecheck          # tsc --noEmit (must be clean before any PR)
npm run lint               # eslint
npm run format             # prettier --write
npm run build              # tsc --noEmit + vite build (frontend only)
npm run tauri build        # full signed installer → src-tauri/target/release/bundle/
cd src-tauri && cargo test # Rust unit tests
```

Pre-flight before spawning agents: `npm test && npm run typecheck` must both exit 0.

---

## Conventions

### Naming

- Files: `kebab-case.ts` / `PascalCase.tsx` for components
- CSS tokens: `--category-name`
- CSS classes: `kebab-case`, feature-prefixed (`paper-`, `cb-`, `sb-`, `um-`, `pb-`, `tu-` for updater toast)

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
