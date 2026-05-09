import { describe, expect, it } from 'vitest';
import { joinPath } from '../storage';

describe('joinPath', () => {
  it('joins POSIX paths with /', () => {
    expect(joinPath('/Users/johnk/Documents/margin', '2026-05-08.md')).toBe(
      '/Users/johnk/Documents/margin/2026-05-08.md',
    );
  });

  it('joins Windows paths with \\', () => {
    expect(joinPath('C:\\Users\\johnk\\Documents\\margin', '2026-05-08.md')).toBe(
      'C:\\Users\\johnk\\Documents\\margin\\2026-05-08.md',
    );
  });

  it('strips trailing separators before joining', () => {
    expect(joinPath('/tmp/journal/', 'x.md')).toBe('/tmp/journal/x.md');
    expect(joinPath('C:\\tmp\\journal\\', 'x.md')).toBe('C:\\tmp\\journal\\x.md');
  });

  it('treats mixed-separator paths as POSIX', () => {
    expect(joinPath('C:/Users/johnk/journal', 'x.md')).toBe(
      'C:/Users/johnk/journal/x.md',
    );
  });
});
