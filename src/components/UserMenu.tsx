import { useState } from 'react';
import { Settings } from 'lucide-react';
import { open } from '@tauri-apps/plugin-dialog';

import { setJournalDir as persistJournalDir } from '../lib/config';
import { useMargin } from '../store';

interface SettingsModalProps {
  onClose: () => void;
}

function SettingsModal({ onClose }: SettingsModalProps): JSX.Element {
  const journalDir = useMargin((s) => s.journalDir);
  const setJournalDir = useMargin((s) => s.setJournalDir);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

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

        <hr className="um-divider" />

        <p className="um-meta">
          margin — local notes, no cloud, no telemetry.
        </p>

        <div className="um-actions">
          <button type="button" className="btn btn-primary" onClick={onClose}>
            Close
          </button>
        </div>
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
