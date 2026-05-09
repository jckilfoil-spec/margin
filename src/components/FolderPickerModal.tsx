import { useState } from 'react';
import { open } from '@tauri-apps/plugin-dialog';

interface Props {
  onPicked: (path: string) => void | Promise<void>;
}

export function FolderPickerModal({ onPicked }: Props): JSX.Element {
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<boolean>(false);

  async function handlePick(): Promise<void> {
    setError(null);
    setBusy(true);
    try {
      const result = await open({
        directory: true,
        multiple: false,
        title: 'Choose where your journal lives',
      });
      if (typeof result === 'string' && result.length > 0) {
        await onPicked(result);
      } else {
        setError('No folder chosen — pick one to continue.');
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(`Could not open picker: ${msg}`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className="mdl-bg"
      role="dialog"
      aria-modal="true"
      aria-labelledby="mdl-title"
    >
      <div className="mdl">
        <h2 id="mdl-title" className="mdl-title">
          Where should your journal live?
        </h2>
        <p className="mdl-body">
          margin saves each day as a Markdown file in a folder you choose.
          You can change this later from settings.
        </p>
        {error !== null ? (
          <p className="mdl-error" role="alert">
            {error}
          </p>
        ) : null}
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => {
            void handlePick();
          }}
          disabled={busy}
        >
          {busy ? 'Opening picker…' : 'Choose a folder…'}
        </button>
      </div>
    </div>
  );
}
