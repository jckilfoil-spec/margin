import { invoke } from '@tauri-apps/api/core';

export async function getJournalDir(): Promise<string | null> {
  return await invoke<string | null>('get_journal_dir');
}

export async function setJournalDir(path: string): Promise<void> {
  await invoke('set_journal_dir', { path });
}
