import { useEffect, useRef, useState } from 'react';
import { Check, Trash2, X } from 'lucide-react';

interface Props {
  initialValue: string;
  placeholder?: string;
  /**
   * Called when the user commits via Enter or the save button. The promise
   * lets the field stay in busy state until the save resolves; throwing
   * surfaces an inline error and keeps the field open for another attempt.
   */
  onSave: (value: string) => Promise<void>;
  onCancel: () => void;
  /** When provided, a trash button shows next to save/cancel. */
  onDelete?: () => void | Promise<void>;
  /** Tone for tooltip / aria text — "section" or "page". */
  kind?: 'section' | 'page';
}

export function EditField({
  initialValue,
  placeholder,
  onSave,
  onCancel,
  onDelete,
  kind = 'page',
}: Props): JSX.Element {
  const [value, setValue] = useState(initialValue);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const el = inputRef.current;
    if (el === null) return;
    el.focus();
    el.select();
  }, []);

  async function commit(): Promise<void> {
    if (busy) return;
    const trimmed = value.trim();
    if (trimmed.length === 0) {
      setError('Name cannot be empty.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await onSave(trimmed);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setBusy(false);
    }
  }

  function handleKey(e: React.KeyboardEvent<HTMLInputElement>): void {
    if (e.key === 'Enter') {
      e.preventDefault();
      void commit();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onCancel();
    }
  }

  return (
    <div className="ef">
      <input
        ref={inputRef}
        type="text"
        className="ef-input"
        value={value}
        placeholder={placeholder}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKey}
        disabled={busy}
        aria-label={kind === 'section' ? 'Section name' : 'Page name'}
      />
      <button
        type="button"
        className="ef-btn ef-save"
        onClick={() => void commit()}
        disabled={busy}
        aria-label="Save"
        title="Save (Enter)"
      >
        <Check size={14} aria-hidden="true" />
      </button>
      <button
        type="button"
        className="ef-btn ef-cancel"
        onClick={onCancel}
        disabled={busy}
        aria-label="Cancel"
        title="Cancel (Esc)"
      >
        <X size={14} aria-hidden="true" />
      </button>
      {onDelete !== undefined ? (
        <button
          type="button"
          className="ef-btn ef-delete"
          onClick={() => void onDelete()}
          disabled={busy}
          aria-label={kind === 'section' ? 'Delete section' : 'Delete page'}
          title={kind === 'section' ? 'Delete section' : 'Delete page'}
        >
          <Trash2 size={14} aria-hidden="true" />
        </button>
      ) : null}
      {error !== null ? (
        <span className="ef-error" role="alert">
          {error}
        </span>
      ) : null}
    </div>
  );
}
