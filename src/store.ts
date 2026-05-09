import { create } from 'zustand';
import type { Editor } from '@tiptap/react';
import type { Update } from '@tauri-apps/plugin-updater';

interface MarginStore {
  // Folder containing all journal *.md files. Mirrors the value persisted
  // in app config — so writes here happen alongside the Tauri command.
  journalDir: string | null;

  // Absolute path of the journal page currently open. Lives at the root
  // of journalDir for the virtual "Daily" group, or in a section subdir.
  activePath: string | null;

  // Bumped to nudge the sidebar to re-list files (e.g., after we create
  // today's file on first open, or after add/rename/delete).
  refreshKey: number;

  // The live TipTap editor instance, if mounted. PromptButton reaches for
  // this to insert a blockquote at the cursor.
  editor: Editor | null;

  // The live Update object from @tauri-apps/plugin-updater when a newer
  // version is available; null when no update is pending.
  updateAvailable: Update | null;

  // In-memory only — versions the user clicked "Later" on this session.
  // Not persisted; re-prompts on next launch.
  dismissedVersions: Set<string>;

  // Force-flush the autosave debounce to disk. Starts as a no-op; App.tsx
  // replaces it via setFlushFn once flush is defined.
  flushAutosaveNow: () => Promise<void>;

  setJournalDir: (dir: string | null) => void;
  setActivePath: (path: string | null) => void;
  bumpRefresh: () => void;
  setEditor: (editor: Editor | null) => void;
  setUpdateAvailable: (u: Update | null) => void;
  dismissVersion: (v: string) => void;
  setFlushFn: (fn: () => Promise<void>) => void;
}

export const useMargin = create<MarginStore>((set) => ({
  journalDir: null,
  activePath: null,
  refreshKey: 0,
  editor: null,
  updateAvailable: null,
  dismissedVersions: new Set<string>(),
  flushAutosaveNow: async () => {
    // no-op until App.tsx registers the real flush via setFlushFn
  },
  setJournalDir: (dir) => set({ journalDir: dir }),
  setActivePath: (path) => set({ activePath: path }),
  bumpRefresh: () => set((s) => ({ refreshKey: s.refreshKey + 1 })),
  setEditor: (editor) => set({ editor }),
  setUpdateAvailable: (u) => set({ updateAvailable: u }),
  dismissVersion: (v) =>
    set((s) => ({
      dismissedVersions: new Set([...s.dismissedVersions, v]),
    })),
  setFlushFn: (fn) => set({ flushAutosaveNow: fn }),
}));
