import { useCallback, useEffect, useRef, useState } from 'react';

import { FolderPickerModal } from './components/FolderPickerModal';
import { PaperEditor } from './components/PaperEditor';
import { PromptButton } from './components/PromptButton';
import { Sidebar } from './components/Sidebar';
import { UserMenu } from './components/UserMenu';
import {
  getJournalDir,
  setJournalDir as persistJournalDir,
} from './lib/config';
import { todayHeader, todayJournalName } from './lib/dates';
import {
  ensureJournalDir,
  joinPath,
  journalFileExists,
  readJournalFile,
  writeJournalFile,
} from './lib/storage';
import { useMargin } from './store';

const AUTOSAVE_MS = 500;

interface ActiveFile {
  path: string;
  initialMarkdown: string;
}

function describeError(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}

export function App(): JSX.Element {
  const journalDir = useMargin((s) => s.journalDir);
  const activeFilename = useMargin((s) => s.activeFilename);
  const setJournalDirState = useMargin((s) => s.setJournalDir);
  const setActiveFilename = useMargin((s) => s.setActiveFilename);
  const bumpRefresh = useMargin((s) => s.bumpRefresh);

  const [configLoaded, setConfigLoaded] = useState(false);
  const [active, setActive] = useState<ActiveFile | null>(null);
  const [error, setError] = useState<string | null>(null);

  const activeRef = useRef<ActiveFile | null>(null);
  useEffect(() => {
    activeRef.current = active;
  }, [active]);

  const pendingMd = useRef<string | null>(null);
  const timerRef = useRef<number | null>(null);

  const flush = useCallback(async (): Promise<void> => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    const a = activeRef.current;
    const md = pendingMd.current;
    if (a === null || md === null) return;
    // If the file was deleted out from under us (e.g., the user removed it
    // from the sidebar while a save was pending), drop the save instead of
    // recreating the file via writeJournalFile's implicit create.
    if (!(await journalFileExists(a.path))) {
      pendingMd.current = null;
      return;
    }
    pendingMd.current = null;
    await writeJournalFile(a.path, md);
  }, []);

  const schedule = useCallback(
    (md: string) => {
      pendingMd.current = md;
      if (timerRef.current !== null) window.clearTimeout(timerRef.current);
      timerRef.current = window.setTimeout(() => {
        timerRef.current = null;
        flush().catch((e: unknown) => {
          setError(`Save failed: ${describeError(e)}`);
        });
      }, AUTOSAVE_MS);
    },
    [flush],
  );

  // 1) Load journalDir from Tauri config on mount.
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const dir = await getJournalDir();
        if (cancelled) return;
        if (dir !== null && dir.length > 0) {
          setJournalDirState(dir);
        }
      } catch (e) {
        if (cancelled) return;
        setError(`Could not read app config: ${describeError(e)}`);
      } finally {
        if (!cancelled) setConfigLoaded(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [setJournalDirState]);

  // 2) Default activeFilename to today once a journalDir is set.
  useEffect(() => {
    if (journalDir === null) return;
    if (activeFilename !== null) return;
    setActiveFilename(todayJournalName());
  }, [journalDir, activeFilename, setActiveFilename]);

  // 3) When journalDir + activeFilename are set, load the file (creating
  // today's on demand). Flushes any pending save first so switching from
  // a draft doesn't lose keystrokes.
  useEffect(() => {
    if (journalDir === null || activeFilename === null) return undefined;
    let cancelled = false;
    void (async () => {
      try {
        await flush();
        await ensureJournalDir(journalDir);
        const path = joinPath(journalDir, activeFilename);
        const isToday = activeFilename === todayJournalName();
        const exists = await journalFileExists(path);
        if (!exists) {
          if (!isToday) {
            throw new Error(`File not found: ${activeFilename}`);
          }
          await writeJournalFile(path, `${todayHeader()}\n\n`);
          bumpRefresh();
        }
        const content = await readJournalFile(path);
        if (cancelled) return;
        setActive({ path, initialMarkdown: content });
      } catch (e) {
        if (cancelled) return;
        setError(`Could not open ${activeFilename}: ${describeError(e)}`);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [journalDir, activeFilename, bumpRefresh, flush]);

  // 4) Best-effort flush on window blur — covers most close paths without
  // an onCloseRequested handler (which hangs the X on Windows).
  useEffect(() => {
    function onBlur(): void {
      flush().catch(() => undefined);
    }
    window.addEventListener('blur', onBlur);
    return () => window.removeEventListener('blur', onBlur);
  }, [flush]);

  async function handlePicked(path: string): Promise<void> {
    try {
      await persistJournalDir(path);
      setJournalDirState(path);
    } catch (e) {
      setError(`Could not save folder choice: ${describeError(e)}`);
    }
  }

  if (!configLoaded) {
    return <main className="paper-surface" aria-label="margin notepad" />;
  }

  if (journalDir === null) {
    return (
      <>
        <main className="paper-surface" aria-label="margin notepad" />
        <FolderPickerModal onPicked={handlePicked} />
      </>
    );
  }

  return (
    <div className="app-shell">
      <aside className="sb-shell">
        <Sidebar />
        <div className="sb-footer">
          <UserMenu />
        </div>
      </aside>
      <main className="paper-surface" aria-label="margin notepad">
        {error !== null ? (
          <p className="pe-error" role="alert">
            {error}
          </p>
        ) : null}
        {active !== null ? (
          <PaperEditor
            key={active.path}
            initialMarkdown={active.initialMarkdown}
            onChange={schedule}
          />
        ) : null}
      </main>
      <PromptButton />
    </div>
  );
}
