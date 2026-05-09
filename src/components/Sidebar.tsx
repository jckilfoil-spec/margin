import { useEffect, useState } from 'react';
import { Plus, X } from 'lucide-react';
import { confirm } from '@tauri-apps/plugin-dialog';

import {
  nextPageFilename,
  todayDateString,
  todayJournalName,
} from '../lib/dates';
import { groupByMonth } from '../lib/sidebar';
import {
  deleteJournalFile,
  joinPath,
  journalFileExists,
  listJournalFiles,
  writeJournalFile,
} from '../lib/storage';
import { useMargin } from '../store';

export function Sidebar(): JSX.Element {
  const journalDir = useMargin((s) => s.journalDir);
  const activeFilename = useMargin((s) => s.activeFilename);
  const setActiveFilename = useMargin((s) => s.setActiveFilename);
  const bumpRefresh = useMargin((s) => s.bumpRefresh);
  const refreshKey = useMargin((s) => s.refreshKey);

  const [files, setFiles] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (journalDir === null) return;
    let cancelled = false;
    void listJournalFiles(journalDir)
      .then((list) => {
        if (cancelled) return;
        setFiles(list);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [journalDir, refreshKey]);

  async function addNewPage(): Promise<void> {
    if (journalDir === null || busy) return;
    setBusy(true);
    try {
      const today = todayDateString();
      // Re-list so we see any concurrent additions / external changes.
      let existing = await listJournalFiles(journalDir);
      let next = nextPageFilename(existing, today);
      let path = joinPath(journalDir, next);
      // Tight retry to dodge a race where the computed name was just used.
      for (let i = 0; i < 5; i++) {
        if (!(await journalFileExists(path))) break;
        existing = [...existing, next];
        next = nextPageFilename(existing, today);
        path = joinPath(journalDir, next);
      }
      await writeJournalFile(path, `# ${next.slice(0, -3)}\n\n`);
      bumpRefresh();
      setActiveFilename(next);
    } finally {
      setBusy(false);
    }
  }

  async function deletePage(filename: string): Promise<void> {
    if (journalDir === null) return;
    const yes = await confirm(`Delete ${filename.slice(0, -3)}?`, {
      title: 'Delete page',
      kind: 'warning',
    });
    if (!yes) return;
    const path = joinPath(journalDir, filename);
    await deleteJournalFile(path);
    bumpRefresh();
    if (activeFilename === filename) {
      setActiveFilename(todayJournalName());
    }
  }

  const groups = groupByMonth(files);

  return (
    <nav className="sb" aria-label="Prior days">
      <button
        type="button"
        className="sb-add"
        onClick={() => {
          void addNewPage();
        }}
        disabled={busy || journalDir === null}
      >
        <Plus size={14} aria-hidden="true" />
        <span>New page</span>
      </button>

      {groups.length === 0 ? (
        <p className="sb-empty">No prior days yet — today is day 1.</p>
      ) : (
        groups.map((g) => (
          <section key={g.month} className="sb-month">
            <h3 className="sb-month-header">{g.month}</h3>
            <ul className="sb-days">
              {g.days.map((d) => {
                const isActive = activeFilename === d.filename;
                return (
                  <li key={d.filename} className="sb-day-row">
                    <button
                      type="button"
                      className={`sb-day${isActive ? ' is-active' : ''}`}
                      onClick={() => setActiveFilename(d.filename)}
                    >
                      {d.dateString}
                    </button>
                    <button
                      type="button"
                      className="sb-day-delete"
                      aria-label={`Delete ${d.dateString}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        void deletePage(d.filename);
                      }}
                    >
                      <X size={12} aria-hidden="true" />
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>
        ))
      )}
    </nav>
  );
}
