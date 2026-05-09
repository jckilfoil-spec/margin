import { describe, expect, it } from 'vitest';
import { groupByMonth } from '../sidebar';

describe('groupByMonth', () => {
  it('returns an empty array for an empty input', () => {
    expect(groupByMonth([])).toEqual([]);
  });

  it('groups files into months newest-first', () => {
    const groups = groupByMonth([
      '2026-04-29.md',
      '2026-05-08.md',
      '2026-04-30.md',
      '2026-05-07.md',
    ]);
    expect(groups).toEqual([
      {
        month: 'May 2026',
        days: [
          { filename: '2026-05-08.md', dateString: '2026-05-08' },
          { filename: '2026-05-07.md', dateString: '2026-05-07' },
        ],
      },
      {
        month: 'April 2026',
        days: [
          { filename: '2026-04-30.md', dateString: '2026-04-30' },
          { filename: '2026-04-29.md', dateString: '2026-04-29' },
        ],
      },
    ]);
  });

  it('keeps year boundaries straight', () => {
    const groups = groupByMonth(['2025-12-31.md', '2026-01-01.md']);
    expect(groups.map((g) => g.month)).toEqual(['January 2026', 'December 2025']);
  });

  it('ignores filenames that are not YYYY-MM-DD.md', () => {
    const groups = groupByMonth([
      '2026-05-08.md',
      'README.md',
      '2026-13-01.md', // invalid month
      'notes.txt',
      '2026-05-99.md', // invalid day
    ]);
    expect(groups).toEqual([
      {
        month: 'May 2026',
        days: [{ filename: '2026-05-08.md', dateString: '2026-05-08' }],
      },
    ]);
  });
});
