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

// Atomically allocates the next page named `<base>` (or `<base>_NN`) inside
// `dir`. Tries `<base>.md` first; falls through to suffix logic on collision.
// Lives in Rust (OpenOptions::create_new) so concurrent calls can never
// land on the same filename.
export async function appendPage(dir: string, base: string): Promise<string> {
  return await invoke<string>('append_page', { dir, base });
}

export async function listSections(dir: string): Promise<string[]> {
  return await invoke<string[]>('list_sections', { dir });
}

export async function createSection(dir: string, name: string): Promise<void> {
  await invoke('create_section', { dir, name });
}

export async function renameSection(
  dir: string,
  oldName: string,
  newName: string,
): Promise<void> {
  await invoke('rename_section', { dir, oldName, newName });
}

export async function deleteSection(sectionPath: string): Promise<void> {
  await invoke('delete_section', { sectionPath });
}

export async function renameJournalFile(
  oldPath: string,
  newPath: string,
): Promise<void> {
  await invoke('rename_journal_file', { oldPath, newPath });
}

// Returns the directory portion of a path, computed locally so we don't
// round-trip to Rust just to strip the last segment.
export function dirname(path: string): string {
  const m = /^(.*)[\\/][^\\/]+$/.exec(path);
  return m === null ? path : (m[1] ?? '');
}

export function basename(path: string): string {
  const m = /[\\/]([^\\/]+)$/.exec(path);
  return m === null ? path : (m[1] ?? '');
}

// Cross-platform path join. The journal dir comes from the OS picker so its
// own separator is the source of truth — we only fall back to '/' if the path
// somehow has neither.
export function joinPath(dir: string, name: string): string {
  const sep = dir.includes('\\') && !dir.includes('/') ? '\\' : '/';
  const trimmed = dir.replace(/[\\/]+$/, '');
  return `${trimmed}${sep}${name}`;
}
