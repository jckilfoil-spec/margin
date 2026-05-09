import { invoke } from '@tauri-apps/api/core';

export async function listJournalFiles(dir: string): Promise<string[]> {
  return await invoke<string[]>('list_journal_files', { dir });
}

export async function readJournalFile(path: string): Promise<string> {
  return await invoke<string>('read_journal_file', { path });
}

export async function writeJournalFile(
  path: string,
  contents: string,
): Promise<void> {
  await invoke('write_journal_file', { path, contents });
}

export async function journalFileExists(path: string): Promise<boolean> {
  return await invoke<boolean>('journal_file_exists', { path });
}

export async function ensureJournalDir(path: string): Promise<void> {
  await invoke('ensure_journal_dir', { path });
}

export async function deleteJournalFile(path: string): Promise<void> {
  await invoke('delete_journal_file', { path });
}

// Cross-platform path join. The journal dir comes from the OS picker so its
// own separator is the source of truth — we only fall back to '/' if the path
// somehow has neither.
export function joinPath(dir: string, name: string): string {
  const sep = dir.includes('\\') && !dir.includes('/') ? '\\' : '/';
  const trimmed = dir.replace(/[\\/]+$/, '');
  return `${trimmed}${sep}${name}`;
}
