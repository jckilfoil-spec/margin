// Pure helpers used by Sidebar to turn a flat list of journal filenames
// into month-grouped, newest-first day entries. Tested in isolation so we
// can iterate on the rendering without re-validating the math.

export interface DayEntry {
  filename: string;
  dateString: string; // 'YYYY-MM-DD'
}

export interface MonthGroup {
  month: string; // 'May 2026'
  days: DayEntry[];
}

const FILENAME_PATTERN = /^(\d{4})-(\d{2})-(\d{2})\.md$/;
const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

interface ParsedFile {
  filename: string;
  year: number;
  month: number; // 1-indexed
  day: number;
}

function parseFilename(filename: string): ParsedFile | null {
  const m = FILENAME_PATTERN.exec(filename);
  if (m === null) return null;
  const year = Number(m[1]);
  const month = Number(m[2]);
  const day = Number(m[3]);
  if (
    !Number.isFinite(year) ||
    !Number.isFinite(month) ||
    !Number.isFinite(day) ||
    month < 1 ||
    month > 12 ||
    day < 1 ||
    day > 31
  ) {
    return null;
  }
  return { filename, year, month, day };
}

export function groupByMonth(filenames: string[]): MonthGroup[] {
  const parsed: ParsedFile[] = [];
  for (const f of filenames) {
    const p = parseFilename(f);
    if (p !== null) parsed.push(p);
  }

  // Sort newest first (lexicographic on YYYY-MM-DD also works, but explicit
  // numeric comparison keeps intent obvious).
  parsed.sort((a, b) => {
    if (a.year !== b.year) return b.year - a.year;
    if (a.month !== b.month) return b.month - a.month;
    return b.day - a.day;
  });

  const groups: MonthGroup[] = [];
  for (const p of parsed) {
    const monthLabel = `${MONTH_NAMES[p.month - 1]} ${p.year}`;
    const dateString = p.filename.slice(0, -3); // strip '.md'
    const last = groups[groups.length - 1];
    if (last !== undefined && last.month === monthLabel) {
      last.days.push({ filename: p.filename, dateString });
    } else {
      groups.push({
        month: monthLabel,
        days: [{ filename: p.filename, dateString }],
      });
    }
  }
  return groups;
}
