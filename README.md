# margin

> A personal paper-feel notepad with chunky, satisfying checkboxes. Built for
> daily journaling, on-demand reflection, and never-shrinking checkboxes.

---

## What it is

`margin` is a desktop notepad that looks and feels like a sheet of modern ruled
paper. It opens to today's page, writes Markdown to disk, and renders chunky
checkboxes whose check marks intentionally spill outside the box when you tap
them — because that little overflow is the satisfying part.

Built for one user (John). Local-only. No accounts, no sync, no cloud — just
a folder of `.md` files you own.

---

## Quickstart

```sh
# Prereqs: Rust toolchain + Node 20+
# Tauri scaffold:
npm install
npm run tauri dev          # launches the desktop app in dev mode
```

### Other commands

```sh
npm run tauri build        # produces a signed installer in src-tauri/target/release/bundle
npm test                   # vitest run (frontend logic)
npm run typecheck          # tsc --noEmit
npm run lint               # eslint
npm run format             # prettier --write
cd src-tauri && cargo test # rust-side unit tests
```

---

## How it stays simple

- **No backend.** Every note is a Markdown file in a folder you choose on first launch.
- **No accounts.** Single-user, local-only.
- **No proprietary format.** Plain `.md` — readable in any editor, syncable with any cloud you trust.
- **No telemetry.** This thing is for thinking out loud, not for being measured.

---

## Stack

| Layer | Choice | Why |
|---|---|---|
| Shell | Tauri 2 (Rust) | ~10 MB installer, native feel, low memory |
| Frontend | TypeScript (strict) + Vite + React | Fast iteration, well-known to John |
| Styling | CSS variables (no Tailwind) | Custom paper aesthetic needs hand-tuned tokens |
| Editor | TipTap (ProseMirror) with Markdown extension | Mature WYSIWYG-ish Markdown editing |
| Storage | Local Markdown files (Tauri `fs` plugin) | Portable, future-proof |
| Tests | Vitest (frontend) + cargo test (Rust) | Standard for both sides |
| Deploy | None — local install only | No backend |
| Analytics | None | Personal tool, deliberately unmeasured |

---

## Project docs

- [SPEC.md](SPEC.md) — v1 product spec (this is the contract)
- [HANDOFF.md](HANDOFF.md) — Claude Code implementation brief
- [DESIGN.md](DESIGN.md) — paper aesthetic + chunky-checkbox spec
- [CLAUDE.md](CLAUDE.md) — architecture + session log
- [STRATEGY.md](STRATEGY.md) — why this exists
- [TODO.md](TODO.md) — open follow-ups

---

## License

Personal use, John only.
