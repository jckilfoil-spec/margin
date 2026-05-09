import { create } from 'zustand';
import type { Editor } from '@tiptap/react';

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

  setJournalDir: (dir: string | null) => void;
  setActivePath: (path: string | null) => void;
  bumpRefresh: () => void;
  setEditor: (editor: Editor | null) => void;
}

export const useMargin = create<MarginStore>((set) => ({
  journalDir: null,
  activePath: null,
  refreshKey: 0,
  editor: null,
  setJournalDir: (dir) => set({ journalDir: dir }),
  setActivePath: (path) => set({ activePath: path }),
  bumpRefresh: () => set((s) => ({ refreshKey: s.refreshKey + 1 })),
  setEditor: (editor) => set({ editor }),
}));
