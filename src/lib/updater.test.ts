import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// ---------------------------------------------------------------------------
// Module mocks — must come before any imports that pull in the mocked modules
// ---------------------------------------------------------------------------

vi.mock('@tauri-apps/plugin-updater', () => ({
  check: vi.fn(),
}));

vi.mock('@tauri-apps/api/app', () => ({
  getVersion: vi.fn().mockResolvedValue('0.0.1'),
}));

// semver is a real package; import it for real so the version-guard logic
// works correctly in the tests.

import { check } from '@tauri-apps/plugin-updater';
import { checkForUpdate } from './updater';
import { useMargin } from '../store';

const checkMock = vi.mocked(check);

/** A minimal stand-in for the Update object returned by the plugin. */
function fakeUpdate(version: string): ReturnType<typeof check> extends Promise<infer U> ? U : never {
  return {
    version,
    currentVersion: '0.0.1',
    date: null,
    body: null,
    downloadAndInstall: vi.fn(),
  } as unknown as ReturnType<typeof check> extends Promise<infer U> ? U : never;
}

function resetStore(): void {
  useMargin.setState({
    updateAvailable: null,
    dismissedVersions: new Set<string>(),
  });
}

describe('checkForUpdate', () => {
  beforeEach(() => {
    checkMock.mockReset();
    resetStore();
  });

  afterEach(() => {
    resetStore();
  });

  it('leaves updateAvailable null when check() returns null', async () => {
    checkMock.mockResolvedValue(null);

    await checkForUpdate();

    expect(useMargin.getState().updateAvailable).toBeNull();
  });

  it('calls setUpdateAvailable when a newer version is available', async () => {
    checkMock.mockResolvedValue(fakeUpdate('0.0.2'));

    await checkForUpdate();

    const u = useMargin.getState().updateAvailable;
    expect(u).not.toBeNull();
    expect(u?.version).toBe('0.0.2');
  });

  it('does NOT surface an update when the returned version equals current', async () => {
    // getVersion is mocked to return '0.0.1'; update.version is also '0.0.1'
    checkMock.mockResolvedValue(fakeUpdate('0.0.1'));

    await checkForUpdate();

    expect(useMargin.getState().updateAvailable).toBeNull();
  });

  it('does NOT surface an update when the version is already in dismissedVersions', async () => {
    checkMock.mockResolvedValue(fakeUpdate('0.0.2'));
    useMargin.setState({
      dismissedVersions: new Set(['0.0.2']),
    });

    await checkForUpdate(); // ignoreSuppressionList defaults to false

    expect(useMargin.getState().updateAvailable).toBeNull();
  });

  it('surfaces the update even when dismissed if ignoreSuppressionList=true', async () => {
    checkMock.mockResolvedValue(fakeUpdate('0.0.2'));
    useMargin.setState({
      dismissedVersions: new Set(['0.0.2']),
    });

    await checkForUpdate(true); // manual recheck always shows the toast

    const u = useMargin.getState().updateAvailable;
    expect(u).not.toBeNull();
    expect(u?.version).toBe('0.0.2');
  });

  it('swallows errors silently — does not throw', async () => {
    checkMock.mockRejectedValue(new Error('Network error'));

    await expect(checkForUpdate()).resolves.toBeUndefined();
    expect(useMargin.getState().updateAvailable).toBeNull();
  });
});
