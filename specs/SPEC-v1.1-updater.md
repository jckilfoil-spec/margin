# SPEC: margin v1.1 — Auto-updater

**Date:** 2026-05-09
**Status:** [x] Draft → [x] Ready → [x] In implementation → [ ] Done
**Branch:** `feat/v1.1-updater`
**Agent brief generated:** [x] Yes (see `specs/HANDOFF-v1.1-updater.md`)

---

## Problem

margin v1 ships as a frozen MSI. Once installed, it has no path to receive
bug fixes or new features short of a manual rebuild + re-install by the user
themselves. This is fine while John is the only user, but the moment the app
is shared — even with one other person — every fix means asking them to
re-download. It also locks v0.0.1 onto every machine forever, which is the
single worst version to be stranded on (it has the bugs nobody's reported yet).

Wiring the updater now, before any external user installs the app, is the
cheapest insurance against a stranded user base later. It also unblocks the
public-launch backlog (see `TODO.md` → `Infra + deploy / public launch`),
since signing + distribution + auto-update are interdependent decisions.

---

## Not in scope (v1.1)

- macOS / Linux update channels (Windows-only for now — see `TODO.md` for
  cross-platform deferral)
- Differential / delta updates (full installer download is fine at this size)
- Update channels (stable / beta / nightly) — single channel until there's
  reason for more
- In-app changelog viewer — the toast links to the GitHub release notes URL
- Background download while the app is closed
- Forced updates (no "you must update to continue" gate; v1.1 always lets
  the user defer)
- Telemetry on update success / failure (margin's no-telemetry pillar holds)

---

## User flow

1. **App launches normally.** No new modal, no blocking UI. The window
   mounts and renders today's page exactly as it does today.
2. **~5 seconds after the window is interactive,** a non-blocking background
   check fires against the GitHub Releases endpoint. If no update is
   available (or the network is down), nothing happens — silently.
3. **If a newer signed release exists,** a small toast slides in from the
   bottom-right corner of the window. Copy: *"margin v0.0.2 available. **Install
   now** · **Later** · What's new?"* The "What's new?" link opens the
   GitHub release notes URL in the user's default browser.
4. **User clicks "Later."** Toast dismisses. No nag — won't re-prompt for
   the same version this session. Next launch will offer the same version
   again (same toast, same copy).
5. **User clicks "Install now."** Toast replaces with a small progress
   indicator: *"Downloading v0.0.2…"* with a percentage. On completion,
   message becomes *"Installing — margin will restart"* and Tauri's updater
   runs the installer, which closes the running app and re-launches the
   updated version. The user lands back on today's page (autosave already
   flushed any pending edits before install).
6. **User wants to check manually.** In the bottom-left User menu (cog) →
   About modal, a new row reads *"margin v0.0.1 · **Check for updates**"*.
   Clicking it triggers the same check flow as step 2 — if an update is
   found, the same toast appears; if not, the row text changes briefly to
   *"You're up to date."*
7. **User has the app open across an update.** Toast appears mid-session.
   Same flow. If they ignore it, no second prompt this session.

---

## Acceptance criteria

- [ ] `tauri-plugin-updater` is registered in `src-tauri/src/lib.rs`.
- [ ] `src-tauri/tauri.conf.json` declares the updater plugin with:
  - `endpoints`: a single GitHub Releases URL pointing to `latest.json`
  - `pubkey`: the Ed25519 public key generated for margin (private key
    held by John, never committed)
- [ ] On launch, the app schedules a background `check()` call ~5 seconds
      after window mount. The call is wrapped in try/catch — network
      failures or 404s log to console at `debug` level only and are
      otherwise silent.
- [ ] When `check()` returns an available update, a `<UpdateToast>`
      component renders in the bottom-right with the version, **Install
      now** / **Later** buttons, and a "What's new?" link to the release
      page on GitHub.
- [ ] **Install now** triggers `update.downloadAndInstall()` with a
      progress callback that updates the toast text. On success, the app
      restarts via Tauri's updater (the installer handles the restart).
- [ ] **Later** dismisses the toast and suppresses re-prompting for the
      same version within the current session (in-memory flag, not
      persisted — re-checks on next launch).
- [ ] The About modal (opened from the bottom-left settings cog) shows the
      current app version (read from Tauri at runtime, not hardcoded) and
      a **Check for updates** link.
- [ ] Clicking **Check for updates** in the About modal triggers the same
      check flow as the launch check. If no update, the link text becomes
      *"You're up to date."* for ~3s, then reverts.
- [ ] If autosave has pending edits when **Install now** is clicked, the
      autosave debounce is force-flushed to disk before `downloadAndInstall`
      starts (no data loss across the restart).
- [ ] `npm test` exits 0 and `cd src-tauri && cargo test` exits 0. New
      tests cover: the toast renders given a fake update payload; the
      "Later" suppression behavior; the About-modal recheck happy path.
- [ ] `npm run typecheck` is clean (no `any`).
- [ ] No new `console.log` left in production paths (the silent
      network-fail logging is `console.debug` only).

---

## Edge cases

- **No internet at launch.** `check()` rejects; we swallow and move on.
  No toast, no error UI. User can retry via the About modal.
- **GitHub Releases endpoint returns a 404 (no releases yet).** Treat
  identically to "no update available" — silent. (This will be the
  steady state until the first tagged release.)
- **`latest.json` is malformed or signed with a different key.** The Tauri
  updater rejects the payload. We surface a one-time toast: *"Couldn't
  verify update — try again later."* Logged to console for debug.
- **User clicks Install now on a flaky network and the download stalls.**
  After a 60s no-progress timeout, the toast becomes *"Download stalled —
  Retry / Cancel"*. Cancel returns to the original toast state.
- **App version equals the latest release.** No toast. Silent.
- **App version is *newer* than the latest release** (dev builds, manual
  install of a not-yet-published version). No toast. Silent — never
  downgrade.
- **User clicks Install now mid-typing.** Autosave debounce is flushed
  immediately (existing `window.blur` flush logic is reused or extended
  for this purpose). Editor state is serialized to disk before
  `downloadAndInstall` runs.
- **Two windows / multiple instances.** v1 is single-instance; v1.1
  doesn't change that. Updater check runs once per app launch, not
  per window.
- **User declines, then re-opens the About modal and clicks Check.**
  In-session suppression flag still applies — the recheck either shows
  the toast again (acceptable, same version) or nothing if the flag
  said "already declined." Decision: **manual recheck always shows
  the toast**, ignoring the suppression flag. Manual click is intent.

---

## Data / state changes

| What | Before | After | Notes |
|------|--------|-------|-------|
| `tauri.conf.json` | No updater config | `plugins.updater` block with endpoints + pubkey | Pubkey committed; private key is a CI secret |
| `src-tauri/Cargo.toml` | No updater | `tauri-plugin-updater` v2 dep | |
| `package.json` | No updater | `@tauri-apps/plugin-updater` JS bindings | |
| In-memory store | No update state | `updateAvailable: UpdateInfo \| null` + `dismissedVersions: Set<string>` | Session-only, not persisted |
| GitHub Releases | No releases | First release `v0.0.2` has signed installer + `latest.json` | Created by the release CI (PR 2) |

No on-disk persistence. The "Later" suppression is in-memory only by design —
forgetting on restart is correct (re-prompt is cheap and lets the user
reconsider on a fresh head).

---

## Files to touch

**Frontend (TypeScript + React):**
- `src/lib/updater.ts` *(new)* — thin wrapper around `@tauri-apps/plugin-updater`:
  `checkForUpdate()`, `installUpdate(onProgress)`, version comparison guard
- `src/components/UpdateToast.tsx` *(new)* — bottom-right toast with the
  three states: available / downloading / stalled-or-error
- `src/components/UserMenu.tsx` *(modify)* — add **Check for updates** row
  to the About modal
- `src/App.tsx` *(modify)* — schedule the launch check (~5s post-mount,
  via `setTimeout` cleared on unmount); wire the autosave force-flush hook
  before install
- `src/store.ts` *(modify)* — add `updateAvailable` and
  `dismissedVersions` to the zustand store; expose `flushAutosaveNow()`
  used by both `window.blur` and pre-install
- `src/style.css` *(modify)* — toast styles (`.tu-*` prefix, matching
  existing convention)
- `src/lib/updater.test.ts`, `src/components/UpdateToast.test.tsx` *(new)*
  — Vitest coverage per acceptance bar

**Tauri (Rust):**
- `src-tauri/Cargo.toml` *(modify)* — add `tauri-plugin-updater = "2"`
- `src-tauri/src/lib.rs` *(modify)* — register `tauri_plugin_updater::Builder::new().build()`
- `src-tauri/tauri.conf.json` *(modify)* — `plugins.updater` block:
  ```json
  "updater": {
    "endpoints": [
      "https://github.com/jckilfoil-spec/margin/releases/latest/download/latest.json"
    ],
    "pubkey": "<paste from generated key>"
  }
  ```
- `src-tauri/capabilities/default.json` *(modify)* — grant `updater:default`
  permission to the main window

**Docs:**
- `RUNBOOK.md` *(modify)* — new section *"Cutting a release"* with the
  one-time signing-key generation, the per-release tag-and-push procedure,
  and where the GitHub Action lives
- `CLAUDE.md` *(modify by maintainer, not the agent)* — refresh "Last
  session" + "Pick up here" after merge

**Off-limits to the implementing agent:**
- `CLAUDE.md`, `AGENTS.md`, `SPEC.md` (the v1 spec), `HANDOFF.md` (the v1
  handoff), `DESIGN.md`, `DECISION_LOG.md`, this file
  (`specs/SPEC-v1.1-updater.md`), and `specs/HANDOFF-v1.1-updater.md`

---

## Design / UI notes

**Toast (bottom-right corner of the main window):**
- Position: 16px from bottom, 16px from right (above any future status bar)
- Width: ~320px, height auto
- Background: `--paper` with a subtle 1px `--ink` border; `--radius-md` corners
- Type: body sans, `--text-body` size for the title, smaller for the action row
- Buttons: text-only links in `--ink`, hover underlined
- Animation: fade + slide-up over 200ms; same easing as the chunky-checkbox
  draw to keep motion vocabulary consistent
- Z-index: above editor, below modals

**Don't:**
- Use a system tray notification (margin has no system-tray presence in v1)
- Add a red dot / badge on the user menu — the toast is the affordance
- Make the toast modal — it must never block typing

**About modal additions:**
- New row, below the existing "Change journal folder" entry
- Format: `margin v0.0.1` on the left, `Check for updates` link on the right
- After a manual check, the link replaces with `You're up to date.` for 3s,
  then reverts. No spinner — checks complete in < 1s on a normal connection.

---

## Security notes

- **Private signing key never enters the repo.** Generated on John's
  machine via `npm run tauri signer generate`, stored at
  `~/.tauri/margin.key`, password-protected. The password and key are
  added as GitHub Actions secrets (`TAURI_SIGNING_PRIVATE_KEY`,
  `TAURI_SIGNING_PRIVATE_KEY_PASSWORD`) for the release workflow.
- **Public key is committed.** Lives in `tauri.conf.json`. If the private
  key is ever lost or rotated, every existing installed copy of margin
  will reject all future updates from the new key — they'd need a manual
  re-install. Document this in RUNBOOK.
- **Endpoint uses HTTPS.** Tauri rejects HTTP endpoints by default; we
  rely on that.
- **`latest.json` signature is verified before any binary download.**
  This is Tauri's default behavior — don't disable it.

---

## Open questions

All resolved during the spec session:

1. **Hosting?** GitHub Releases (free, repo already public at
   `jckilfoil-spec/margin`).
2. **Check cadence?** On launch + manual recheck via About modal.
3. **Install UX?** Notify, user decides (Install now / Later).
4. **Cross-platform?** Windows-only for v1.1; macOS / Linux deferred to
   `TODO.md`.

If a fifth question surfaces during implementation, update this spec
before deviating.

---

## Sign-off

- [x] Spec reviewed in Cowork session — no open questions remain
- [x] Acceptance criteria are specific enough to be tested by a stranger
- [x] Data changes are documented
- [x] Files-to-touch list is complete and bounded
- [x] Agent brief generated → `specs/HANDOFF-v1.1-updater.md`
- [x] Ready to open worktree (set when handing off to Claude Code)

_The spec is the contract. If implementation diverges, update the spec first._
