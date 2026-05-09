import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, waitFor } from '@testing-library/react';

vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn(),
}));

vi.mock('@tauri-apps/plugin-dialog', () => ({
  open: vi.fn(),
  confirm: vi.fn(),
}));

vi.mock('../components/PaperEditor', () => ({
  PaperEditor: ({ initialMarkdown }: { initialMarkdown: string }) => (
    <div className="pe-content" data-testid="pe-content">
      {initialMarkdown}
    </div>
  ),
}));

import { invoke } from '@tauri-apps/api/core';
import { App } from '../App';
import { useMargin } from '../store';

const invokeMock = vi.mocked(invoke);

function resetStore(): void {
  useMargin.setState({
    journalDir: null,
    activePath: null,
    refreshKey: 0,
    editor: null,
  });
}

describe('App', () => {
  beforeEach(() => {
    invokeMock.mockReset();
    resetStore();
  });

  afterEach(() => {
    cleanup();
  });

  it('renders the paper surface immediately while config loads', () => {
    invokeMock.mockResolvedValue(null);
    const { container } = render(<App />);
    expect(container.querySelector('.paper-surface')).not.toBeNull();
  });

  it('shows the folder picker modal when no journal dir is set', async () => {
    invokeMock.mockImplementation(async (cmd: string) => {
      if (cmd === 'get_journal_dir') return null;
      return null;
    });
    const { findByRole } = render(<App />);
    const dialog = await findByRole('dialog');
    expect(dialog).not.toBeNull();
    expect(dialog.getAttribute('aria-modal')).toBe('true');
  });

  it("loads today's page into the editor when a journal dir is set", async () => {
    invokeMock.mockImplementation(async (cmd: string) => {
      switch (cmd) {
        case 'get_journal_dir':
          return '/tmp/journal';
        case 'ensure_journal_dir':
          return undefined;
        case 'journal_file_exists':
          return true;
        case 'read_journal_file':
          return '# 2026-05-08\n\nhello\n';
        case 'list_journal_files':
        case 'list_sections':
          return [];
        default:
          return null;
      }
    });
    const { findByTestId } = render(<App />);
    const editor = await findByTestId('pe-content');
    expect(editor.textContent).toContain('2026-05-08');
  });

  it("creates today's file at the journal root when missing", async () => {
    const writes: Array<{ path: string; contents: string }> = [];
    invokeMock.mockImplementation(async (cmd: string, args?: unknown) => {
      switch (cmd) {
        case 'get_journal_dir':
          return '/tmp/journal';
        case 'ensure_journal_dir':
          return undefined;
        case 'journal_file_exists':
          return false;
        case 'write_journal_file': {
          const a = args as { path: string; contents: string };
          writes.push(a);
          return undefined;
        }
        case 'read_journal_file':
          return '# 2026-05-08\n\n';
        case 'list_journal_files':
        case 'list_sections':
          return [];
        default:
          return null;
      }
    });
    const { findByTestId } = render(<App />);
    await findByTestId('pe-content');
    await waitFor(() => {
      expect(writes.length).toBeGreaterThan(0);
    });
    const first = writes[0];
    expect(first).toBeDefined();
    expect(first?.contents.startsWith('# ')).toBe(true);
  });

  it('renders the sidebar shell with sections + pages', async () => {
    invokeMock.mockImplementation(async (cmd: string, args?: unknown) => {
      switch (cmd) {
        case 'get_journal_dir':
          return '/tmp/journal';
        case 'ensure_journal_dir':
          return undefined;
        case 'journal_file_exists':
          return true;
        case 'read_journal_file':
          return '# 2026-05-08\n';
        case 'list_journal_files': {
          const a = args as { dir: string };
          if (a.dir === '/tmp/journal') return ['2026-05-08.md', '2026-05-07.md'];
          if (a.dir === '/tmp/journal/Projects') return ['ideas.md'];
          return [];
        }
        case 'list_sections':
          return ['Projects'];
        default:
          return null;
      }
    });
    const { container, findByText } = render(<App />);
    await findByText('Daily');
    await findByText('Projects');
    await findByText('ideas');
    expect(container.querySelector('.sb-shell')).not.toBeNull();
    expect(container.querySelector('.app-shell')).not.toBeNull();
  });
});
