import { describe, expect, it } from 'vitest';
import {
  nextPageFilename,
  todayDateString,
  todayHeader,
  todayJournalName,
} from '../dates';

describe('dates', () => {
  it('formats UTC date with zero-padded month and day', () => {
    const fixed = new Date(Date.UTC(2026, 4, 8, 23, 30)); // 2026-05-08 23:30Z
    expect(todayDateString(fixed)).toBe('2026-05-08');
    expect(todayJournalName(fixed)).toBe('2026-05-08.md');
    expect(todayHeader(fixed)).toBe('# 2026-05-08');
  });

  it('uses UTC even when local time is on the previous day', () => {
    // 2026-01-01 00:30 UTC is still 2025-12-31 in PST. We want UTC.
    const fixed = new Date(Date.UTC(2026, 0, 1, 0, 30));
    expect(todayDateString(fixed)).toBe('2026-01-01');
  });
});

describe('nextPageFilename', () => {
  it('starts at _01 when only the base file exists', () => {
    expect(nextPageFilename(['2026-05-09.md'], '2026-05-09')).toBe(
      '2026-05-09_01.md',
    );
  });

  it('starts at _01 when nothing exists yet', () => {
    expect(nextPageFilename([], '2026-05-09')).toBe('2026-05-09_01.md');
  });

  it('increments past the highest existing suffix', () => {
    expect(
      nextPageFilename(
        ['2026-05-09.md', '2026-05-09_01.md', '2026-05-09_02.md'],
        '2026-05-09',
      ),
    ).toBe('2026-05-09_03.md');
  });

  it('skips suffixes belonging to other days', () => {
    expect(
      nextPageFilename(['2026-05-08_05.md', '2026-05-08.md'], '2026-05-09'),
    ).toBe('2026-05-09_01.md');
  });

  it('handles non-contiguous existing suffixes by going past the max', () => {
    expect(
      nextPageFilename(['2026-05-09_01.md', '2026-05-09_05.md'], '2026-05-09'),
    ).toBe('2026-05-09_06.md');
  });

  it('pads to two digits but does not truncate three-digit results', () => {
    expect(nextPageFilename(['2026-05-09_99.md'], '2026-05-09')).toBe(
      '2026-05-09_100.md',
    );
  });
});
