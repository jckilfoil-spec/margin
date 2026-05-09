import { describe, expect, it } from 'vitest';
import { basename, dirname, joinPath } from '../storage';

describe('dirname', () => {
  it('strips the last POSIX segment', () => {
    expect(dirname('/Users/johnk/journal/2026-05-09.md')).toBe(
      '/Users/johnk/journal',
    );
  });

  it('strips the last Windows segment', () => {
    expect(dirname('C:\\Users\\johnk\\journal\\2026-05-09.md')).toBe(
      'C:\\Users\\johnk\\journal',
    );
  });

  it('returns the original when there is no separator', () => {
    expect(dirname('only.md')).toBe('only.md');
  });
});

describe('basename', () => {
  it('returns the trailing POSIX segment', () => {
    expect(basename('/journal/2026-05-09.md')).toBe('2026-05-09.md');
  });

  it('returns the trailing Windows segment', () => {
    expect(basename('C:\\journal\\2026-05-09.md')).toBe('2026-05-09.md');
  });

  it('returns the original when there is no separator', () => {
    expect(basename('flat.md')).toBe('flat.md');
  });
});

describe('joinPath round-trips with dirname/basename', () => {
  it('joins after splitting', () => {
    const full = '/journal/Daily/2026-05-09.md';
    expect(joinPath(dirname(full), basename(full))).toBe(full);
  });

  it('joins after splitting (windows)', () => {
    const full = 'C:\\journal\\Daily\\2026-05-09.md';
    expect(joinPath(dirname(full), basename(full))).toBe(full);
  });
});
