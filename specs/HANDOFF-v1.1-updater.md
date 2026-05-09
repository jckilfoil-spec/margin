# HANDOFF: margin v1.1 — Auto-updater → Claude Code

> Paste the brief at the bottom of this file into Claude Code to start the
> implementation session. `specs/SPEC-v1.1-updater.md` is the contract —
> read it first.

---

## Recommended sequencing

The agent should land v1.1 in **two PRs**, not one. PR 1 is the in-app
mechanism (deliverable on John's machine even with no GitHub release yet);
PR 2 is the release pipeline. Sequencing in this order means PR 1 can be
merged and tested locally with a hand-built `latest.json` before the
release CI exists.

### PR 1 — In-app updater wiring + UI (size: M)

**Reasoning:** Mechanism + UX in one PR keeps the diff coherent — the
toast, the launch check, the manual recheck, and the autosave-flush hook
all touch the same store and App.tsx state machine. Splitting them adds
review overhead without isolating risk.

- Add `tauri-plugin-updater = "2"` to `Cargo.toml` and register in `lib.rs`
- Add `@tauri-apps/plugin-updater` to `package.json`
- Configure `tauri.conf.json` `plugins.updater` block (endpoints +
  pubkey placeholder; **John generates the keypair before this PR
  merges** and pastes the public key into the conf — see RUNBOOK
  addition below)
- Grant `updater:default` capability in `src-tauri/capabilities/default.json`
- Implement `src/lib/updater.ts`: `checkForUpdate()`,
  `installUpdate(onProgress)`
- Implement `<UpdateToast>` with the three states (available / downloading /
  stalled-or-error); styles in `src/style.css` under a `.tu-*` prefix
- Wire launch check in `App.tsx`: `setTimeout(() => checkForUpdate(), 5000)`
  on window mount; clear on unmount; result writes to zustand
  `updateAvailable`
- Add **Check for updates** row to `<UserMenu>` About modal; manual
  recheck always shows the toast (ignores in-session suppression flag)
- Extract autosave-flush into `flushAutosaveNow()` on the store; call it
  from both the existing `window.blur` handler and from the
  Install-now path before `downloadAndInstall`
- Tests: `src/lib/updater.test.ts` (mocked check; version-newer guard);
  `src/components/UpdateToast.test.tsx` (renders given a fake update;
  Later-suppresses-same-version; manual recheck overrides suppression)
- Add a brief paragraph to `RUNBOOK.md` titled *"Cutting a release"*
  with the one-time signing-key generation command and where the GH
  secrets need to live (PR 2 will fill in the workflow itself)
- **Acceptance:** with a manually-crafted `latest.json` hosted on a
  test endpoint, the toast appears on launch; clicking Install now
  downloads and replaces the running app; clicking Later dismisses
  with no second prompt that session; About-modal recheck works.

### PR 2 — GitHub Actions release workflow (size: S)

**Reasoning:** Pure CI / docs work. Doesn't change app behavior, just
makes the existing v1.1 mechanism actually receive updates from a real
source. Small enough to ship within the 45-minute budget.

- Add `.github/workflows/release.yml` triggered on tag push matching `v*`
- Workflow steps: checkout → setup Node + Rust → `npm ci` → `npm run
  tauri build` with `TAURI_SIGNING_PRIVATE_KEY` and
  `TAURI_SIGNING_PRIVATE_KEY_PASSWORD` from secrets → use
  `tauri-apps/tauri-action` to publish the artifacts as a draft GitHub
  Release with the `.msi` and the auto-generated `latest.json`
- Add a brief CHANGELOG.md (or extend the README) with the
  tag-and-push procedure: `npm version patch && git push --follow-tags`
- Update `RUNBOOK.md` *"Cutting a release"* section with the full
  procedure and where to find published releases
- **Acceptance:** pushing a tag like `v0.0.2` triggers the workflow; a
  draft release appears on GitHub with a signed installer + valid
  `latest.json`; promoting the draft to published lets the v0.0.1 app
  installed locally see the update on next launch.

---

## Library decisions (don't re-litigate)

| Need | Choice | Why |
|---|---|---|
| Updater plugin | **`tauri-plugin-updater` v2** | Official Tauri plugin; signature verification + restart handled for you; matches the v2 toolchain margin already runs on |
| JS bindings | **`@tauri-apps/plugin-updater`** | The companion package; thin wrapper over the Rust plugin's commands |
| Release CI action | **`tauri-apps/tauri-action`** | Maintained by the Tauri team; handles the multi-platform matrix and `latest.json` generation natively. Use it even though we're Windows-only — keeps the workflow ready for the macOS / Linux expansion noted in `TODO.md` |
| Toast UI | **In-house** (no library) | Single component; matches paper aesthetic; no need to pull in `react-hot-toast` or similar |
| Version comparison | **`semver` (npm)** | Tiny, correct; needed for the "newer-only" guard |

**Do NOT add:** `electron-updater` (we're on Tauri), Sentry / Crashlytics
(no telemetry in v1.x — see margin's invariants), a custom update server
(GitHub Releases is the endpoint), background workers / scheduled checks
(launch + manual is the spec).

---

## Testing notes

- Mock `@tauri-apps/plugin-updater` at the module boundary in Vitest;
  don't try to hit a real Tauri runtime in unit tests.
- For the autosave-flush integration, write a test that asserts
  `flushAutosaveNow()` is called *before* `downloadAndInstall` resolves
  in the Install-now path. This is the data-loss prevention guarantee.
- E2E (Playwright) is out of scope for this PR — Tauri E2E setup is its
  own project. A `TODO` note in the test file pointing at this is fine.
- The `cargo test` suite gets a single trivial test that the updater
  plugin is registered (build-time guarantee).

---

## Acceptance bar (Definition of Done for v1.1)

Every item in `specs/SPEC-v1.1-updater.md` → `Acceptance criteria` must
pass. Plus:

- App still launches in <2s (the 5s scheduled check is non-blocking — verify
  with DevTools Performance trace)
- No `any` in TypeScript, no `console.log` in production paths (debug-level
  logging for silent network failures is fine and intentional)
- Toast animation matches the chunky-checkbox motion vocabulary (200ms,
  same easing — the spec mandates this for consistency)
- `RUNBOOK.md` "Cutting a release" section is concrete enough that John
  could run a release without re-asking the agent how

---

## The brief — paste this into Claude Code

```
## Context
You are implementing margin v1.1 — an in-app auto-updater backed by
GitHub Releases. The full spec is at `specs/SPEC-v1.1-updater.md`. Read
it before writing any code. Supporting context: `CLAUDE.md` (architecture
+ invariants), `DESIGN.md` (paper aesthetic), `specs/HANDOFF-v1.1-updater.md`
(this file — sequencing + library choices).

Stack reminder: Tauri 2 (Rust shell) + React + TypeScript + TipTap. No
Tailwind. Local Markdown files only. The app already exists and ships
as `margin_0.0.1_x64_en-US.msi`. v1 is done; you are extending it, not
scaffolding.

## Task
Implement margin v1.1 in two sequential PRs as described in
`specs/HANDOFF-v1.1-updater.md` "Recommended sequencing":
  1. In-app updater wiring + UI (toast + launch check + manual recheck +
     autosave-flush hook)
  2. GitHub Actions release workflow + RUNBOOK "Cutting a release" docs

PR 1 is the prerequisite for PR 2 — do not start PR 2 until PR 1 is
merged. Each PR is a separate session with its own time budget.

## Acceptance criteria
Every item under "Acceptance criteria" in `specs/SPEC-v1.1-updater.md`
must pass before declaring v1.1 done. Plus the v1.1 Definition of Done
in `specs/HANDOFF-v1.1-updater.md`.

## Time budget
Stop at 45 minutes per PR. If you haven't pushed a commit by then, open
a draft PR describing what's done and what's left, then STOP. Two PRs
total across two sessions, not one mega-PR.

## Off-limits
- Do NOT modify `CLAUDE.md`, `AGENTS.md`, `RUNBOOK.md` (except for the
  one "Cutting a release" section called out in the handoff — touch
  ONLY that section, leave everything else intact), `SPEC.md`,
  `HANDOFF.md`, `DESIGN.md`, `DECISION_LOG.md`, `specs/SPEC-v1.1-updater.md`,
  or `specs/HANDOFF-v1.1-updater.md`
- Do NOT add Tailwind, shadcn/ui, Sentry, or any telemetry / analytics
- Do NOT use `any` in TypeScript
- Do NOT add features outside the spec (delta updates, channels,
  background download while closed, forced updates — all explicitly
  out of scope)
- Do NOT shrink the checkboxes. Ever. (Yes, even though this PR is
  unrelated.)
- Do NOT commit the private signing key, its password, or any
  derivative secret. The pubkey in `tauri.conf.json` is the only
  signing artifact in the repo.

## Pre-flight (PR 1 only)
Before starting, ask John for the public key generated by
`npm run tauri signer generate`. Paste it into `tauri.conf.json`
`plugins.updater.pubkey`. Without this value the updater config is
invalid and the build will fail.
```
