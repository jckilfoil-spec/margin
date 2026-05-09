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

// Given a directory listing and a date string ("YYYY-MM-DD"), return the
// next available "_NN" filename for that date. Pads to two digits; numbers
// past 99 grow naturally (`_100`, `_101`, ...).
export function nextPageFilename(existing: string[], date: string): string {
  const prefix = `${date}_`;
  let max = 0;
  for (const f of existing) {
    if (!f.endsWith('.md')) continue;
    if (!f.startsWith(prefix)) continue;
    const middle = f.slice(prefix.length, -3);
    const n = Number.parseInt(middle, 10);
    if (Number.isInteger(n) && n > max) max = n;
  }
  const next = max + 1;
  return `${date}_${String(next).padStart(2, '0')}.md`;
}
