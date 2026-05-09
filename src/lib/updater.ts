import { check, type Update } from '@tauri-apps/plugin-updater';
import { getVersion } from '@tauri-apps/api/app';
import { useMargin } from '../store';

/**
 * Check for a newer release and surface it via the store.
 *
 * Silently swallows all errors — network down, 404, malformed JSON, etc.
 * The caller is responsible for the 5s launch-delay and any retry logic.
 *
 * @param ignoreSuppressionList - when true, surfaces the update even if the
 *   user previously dismissed it this session (used for manual rechecks).
 */
export async function checkForUpdate(
  ignoreSuppressionList = false,
): Promise<void> {
  try {
    const update = await check();
    if (!update) return;

    // Never downgrade: if installed version >= available, skip.
    const { gt } = await import('semver');
    const current = await getVersion();
    if (!gt(update.version, current)) return;

    const { dismissedVersions, setUpdateAvailable } = useMargin.getState();

    // Don't re-surface a version the user already dismissed this session,
    // unless the caller explicitly asked us to ignore the suppression list
    // (e.g., a manual "Check for updates" click — intent is explicit).
    if (!ignoreSuppressionList && dismissedVersions.has(update.version)) return;

    setUpdateAvailable(update);
  } catch {
    console.debug('[updater] check failed (network or endpoint unavailable)');
  }
}

export type { Update };
