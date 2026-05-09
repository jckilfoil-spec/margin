import { useCallback, useEffect, useRef, useState } from 'react';

import { FolderPickerModal } from './components/FolderPickerModal';
import { PaperEditor } from './components/PaperEditor';
import { getJournalDir, setJournalDir } from './lib/config';
import { todayHeader, todayJournalName } from './lib/dates';
import {
  ensureJournalDir,
  joinPath,
  journalFileExists,
  readJournalFile,
  writeJournalFile,
} from './lib/storage';

const AUTOSAVE_MS = 500;

interface ActiveFile {
  path: string;
  initialMarkdown: string;
}

type DirState =
  | { status: 'loading' }
  | { status: 'unset' }
  | { status: 'ready'; dir: string };

function describeError(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}

export function App(): JSX.Element {
  const [dirState, setDirState] = useState<DirState>({ status: 'loading' });
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

  // 1) Load journal dir from app config.
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const dir = await getJournalDir();
        if (cancelled) return;
        setDirState(
          dir !== null && dir.length > 0
            ? { status: 'ready', dir }
            : { status: 'unset' },
        );
      } catch (e) {
        if (cancelled) return;
        setError(`Could not read app config: ${describeError(e)}`);
        setDirState({ status: 'unset' });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // 2) Once we have a dir, ensure today's file and load it.
  useEffect(() => {
    if (dirState.status !== 'ready') return undefined;
    let cancelled = false;
    void (async () => {
      try {
        await ensureJournalDir(dirState.dir);
        const path = joinPath(dirState.dir, todayJournalName());
        if (!(await journalFileExists(path))) {
          await writeJournalFile(path, `${todayHeader()}\n\n`);
        }
        const content = await readJournalFile(path);
        if (cancelled) return;
        setActive({ path, initialMarkdown: content });
      } catch (e) {
        if (cancelled) return;
        setError(`Could not open today's page: ${describeError(e)}`);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [dirState]);

  // 3) Best-effort flush on window blur (alt-tab, app switch, X click).
  // The 500ms debounce + this blur covers SPEC's "closing the app loses
  // no data" without us holding the window open via onCloseRequested.
  useEffect(() => {
    function onBlur(): void {
      flush().catch(() => undefined);
    }
    window.addEventListener('blur', onBlur);
    return () => window.removeEventListener('blur', onBlur);
  }, [flush]);

  async function handlePicked(path: string): Promise<void> {
    try {
      await setJournalDir(path);
      setDirState({ status: 'ready', dir: path });
    } catch (e) {
      setError(`Could not save folder choice: ${describeError(e)}`);
    }
  }

  if (dirState.status === 'loading') {
    return <main className="paper-surface" aria-label="margin notepad" />;
  }

  if (dirState.status === 'unset') {
    return (
      <>
        <main className="paper-surface" aria-label="margin notepad" />
        <FolderPickerModal onPicked={handlePicked} />
      </>
    );
  }

  return (
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
  );
}
