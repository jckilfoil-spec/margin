import { useEffect, useState } from 'react';
import { Settings, X } from 'lucide-react';
import { open } from '@tauri-apps/plugin-dialog';
import { getVersion } from '@tauri-apps/api/app';

import { setJournalDir as persistJournalDir } from '../lib/config';
import { checkForUpdate } from '../lib/updater';
import { useMargin } from '../store';

interface SettingsModalProps {
  onClose: () => void;
}

function SettingsModal({ onClose }: SettingsModalProps): JSX.Element {
  const journalDir = useMargin((s) => s.journalDir);
  const setJournalDir = useMargin((s) => s.setJournalDir);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [appVersion, setAppVersion] = useState<string | null>(null);
  const [checkStatus, setCheckStatus] = useState<'idle' | 'upToDate'>('idle');

  useEffect(() => {
    getVersion()
      .then((v) => setAppVersion(v))
      .catch(() => undefined);
  }, []);

  function handleCheckForUpdates(): void {
    void (async () => {
      const { updateAvailable: before } = useMargin.getState();
      // Manual recheck always ignores the suppression list
      await checkForUpdate(true);
      const { updateAvailable: after } = useMargin.getState();
      if (after === null || after === before) {
        // No new update surfaced — let the user know they're up to date
        setCheckStatus('upToDate');
        window.setTimeout(() => setCheckStatus('idle'), 3000);
      }
    })();
  }

  async function changeFolder(): Promise<void> {
    setError(null);
    setBusy(true);
    try {
      const result = await open({
        directory: true,
        multiple: false,
        title: 'Choose a new journal folder',
      });
      if (typeof result === 'string' && result.length > 0) {
        await persistJournalDir(result);
        setJournalDir(result);
        onClose();
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(`Could not change folder: ${msg}`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className="mdl-bg"
      role="dialog"
      aria-modal="true"
      aria-labelledby="um-settings-title"
      onClick={onClose}
    >
      <div className="mdl" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          className="mdl-close"
          onClick={onClose}
          aria-label="Close settings"
        >
          <X size={16} aria-hidden="true" />
        </button>

        <h2 id="um-settings-title" className="mdl-title">
          Settings
        </h2>

        <div className="um-row">
          <div className="um-row-text">
            <p className="um-label">Journal folder</p>
            <p className="um-value" title={journalDir ?? ''}>
              {journalDir ?? '—'}
            </p>
          </div>
          <button
            type="button"
            className="btn"
            onClick={() => {
              void changeFolder();
            }}
            disabled={busy}
          >
            {busy ? 'Opening…' : 'Change…'}
          </button>
        </div>

        {error !== null ? (
          <p className="mdl-error" role="alert">
            {error}
          </p>
        ) : null}

        <div className="um-row um-version-row">
          <p className="um-meta">
            margin{appVersion !== null ? ` v${appVersion}` : ''}
          </p>
          <button
            type="button"
            className="um-check-update"
            onClick={handleCheckForUpdates}
          >
            {checkStatus === 'upToDate' ? "You're up to date." : 'Check for updates'}
          </button>
        </div>

        <hr className="um-divider" />

        <p className="um-meta">
          margin — local notes, no cloud, no telemetry.
        </p>
      </div>
    </div>
  );
}

export function UserMenu(): JSX.Element {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        className="um-btn"
        onClick={() => setOpen(true)}
        aria-label="Settings"
        title="Settings"
      >
        <Settings size={18} aria-hidden="true" />
      </button>
      {open ? <SettingsModal onClose={() => setOpen(false)} /> : null}
    </>
  );
}
