// Date helpers for journal filenames.
//
// We use UTC date components so timezone shifts don't create duplicate files
// for the same calendar day (per SPEC.md → Data / state changes).

export function todayDateString(now: Date = new Date()): string {
  const y = now.getUTCFullYear();
  const m = String(now.getUTCMonth() + 1).padStart(2, '0');
  const d = String(now.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function todayJournalName(now: Date = new Date()): string {
  return `${todayDateString(now)}.md`;
}

export function todayHeader(now: Date = new Date()): string {
  return `# ${todayDateString(now)}`;
}
