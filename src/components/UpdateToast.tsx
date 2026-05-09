import { useEffect, useRef, useState } from 'react';
import { open } from '@tauri-apps/plugin-shell';
import type { DownloadEvent } from '@tauri-apps/plugin-updater';
import { useMargin } from '../store';

type ToastState =
  | { kind: 'idle' }
  | { kind: 'available' }
  | { kind: 'downloading'; pct: number }
  | { kind: 'stalled' }
  | { kind: 'error' };

const STALL_TIMEOUT_MS = 60_000;

export function UpdateToast(): JSX.Element | null {
  const update = useMargin((s) => s.updateAvailable);
  const dismissedVersions = useMargin((s) => s.dismissedVersions);
  const dismissVersion = useMargin((s) => s.dismissVersion);
  const setUpdateAvailable = useMargin((s) => s.setUpdateAvailable);
  const flushAutosaveNow = useMargin((s) => s.flushAutosaveNow);

  const [toast, setToast] = useState<ToastState>({ kind: 'idle' });
  const stallTimerRef = useRef<number | null>(null);
  const totalSizeRef = useRef<number | null>(null);
  const downloadedRef = useRef<number>(0);

  // Sync toast visibility with store state
  useEffect(() => {
    if (update === null) {
      setToast({ kind: 'idle' });
      return;
    }
    if (dismissedVersions.has(update.version)) {
      setToast({ kind: 'idle' });
      return;
    }
    setToast({ kind: 'available' });
  }, [update, dismissedVersions]);

  // Clean up stall timer on unmount
  useEffect(() => {
    return () => {
      if (stallTimerRef.current !== null) {
        window.clearTimeout(stallTimerRef.current);
      }
    };
  }, []);

  if (update === null || dismissedVersions.has(update.version)) {
    return null;
  }
  if (toast.kind === 'idle') {
    return null;
  }

  const version = update.version;
  const releaseUrl = `https://github.com/jckilfoil-spec/margin/releases/tag/v${version}`;

  function clearStallTimer(): void {
    if (stallTimerRef.current !== null) {
      window.clearTimeout(stallTimerRef.current);
      stallTimerRef.current = null;
    }
  }

  function resetStallTimer(): void {
    clearStallTimer();
    stallTimerRef.current = window.setTimeout(() => {
      setToast({ kind: 'stalled' });
    }, STALL_TIMEOUT_MS);
  }

  function handleLater(): void {
    dismissVersion(version);
    setUpdateAvailable(null);
  }

  function handleWhatsNew(): void {
    open(releaseUrl).catch(() => undefined);
  }

  function handleRetry(): void {
    setToast({ kind: 'available' });
  }

  function handleCancel(): void {
    // Return to the available toast without dismissing
    setToast({ kind: 'available' });
  }

  function handleInstallNow(): void {
    if (update === null) return;
    void (async () => {
      // Flush pending edits before we trigger the installer restart
      await flushAutosaveNow();

      totalSizeRef.current = null;
      downloadedRef.current = 0;
      setToast({ kind: 'downloading', pct: 0 });
      resetStallTimer();

      try {
        await update.downloadAndInstall((event: DownloadEvent) => {
          if (event.event === 'Started') {
            totalSizeRef.current = event.data.contentLength ?? null;
            resetStallTimer();
          } else if (event.event === 'Progress') {
            downloadedRef.current += event.data.chunkLength;
            const total = totalSizeRef.current;
            if (total !== null && total > 0) {
              const pct = Math.min(
                100,
                Math.round((downloadedRef.current / total) * 100),
              );
              setToast({ kind: 'downloading', pct });
            }
            resetStallTimer();
          } else if (event.event === 'Finished') {
            clearStallTimer();
            // Tauri's updater restarts the app automatically after this
          }
        });
      } catch {
        clearStallTimer();
        setToast({ kind: 'error' });
      }
    })();
  }

  return (
    <div className="tu-toast" role="status" aria-live="polite">
      {toast.kind === 'available' && (
        <>
          <p className="tu-body">
            margin v{version} available.
          </p>
          <div className="tu-actions">
            <button
              type="button"
              className="tu-link tu-link-primary"
              onClick={handleInstallNow}
            >
              Install now
            </button>
            <span className="tu-sep" aria-hidden="true">·</span>
            <button
              type="button"
              className="tu-link"
              onClick={handleLater}
            >
              Later
            </button>
            <span className="tu-sep" aria-hidden="true">·</span>
            <button
              type="button"
              className="tu-link"
              onClick={handleWhatsNew}
            >
              What&apos;s new?
            </button>
          </div>
        </>
      )}

      {toast.kind === 'downloading' && (
        <p className="tu-body">
          Downloading v{version}&hellip; {toast.pct}%
        </p>
      )}

      {toast.kind === 'stalled' && (
        <>
          <p className="tu-body">Download stalled.</p>
          <div className="tu-actions">
            <button
              type="button"
              className="tu-link tu-link-primary"
              onClick={handleRetry}
            >
              Retry
            </button>
            <span className="tu-sep" aria-hidden="true">·</span>
            <button
              type="button"
              className="tu-link"
              onClick={handleCancel}
            >
              Cancel
            </button>
          </div>
        </>
      )}

      {toast.kind === 'error' && (
        <p className="tu-body">
          Couldn&apos;t verify update — try again later.
        </p>
      )}
    </div>
  );
}
