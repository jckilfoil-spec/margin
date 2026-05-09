import { describe, expect, it } from 'vitest';
import { todayDateString, todayHeader, todayJournalName } from '../dates';

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
