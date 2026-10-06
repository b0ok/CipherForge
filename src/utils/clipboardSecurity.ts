let activeTimer: ReturnType<typeof setTimeout> | null = null;
let lastCopiedSecret: string | null = null;

/**
 * Securely copies sensitive credentials to clipboard with Bitwarden-style auto-clear.
 */
export async function secureCopy(
  text: string,
  timeoutSeconds = 30,
  onCleared?: () => void
): Promise<boolean> {
  if (!text) return false;

  try {
    await navigator.clipboard.writeText(text);
    lastCopiedSecret = text;

    if (activeTimer) {
      clearTimeout(activeTimer);
      activeTimer = null;
    }

    if (timeoutSeconds > 0) {
      activeTimer = setTimeout(async () => {
        try {
          // Check if clipboard still has the secret before clearing
          const currentText = await navigator.clipboard.readText().catch(() => null);
          if (currentText === lastCopiedSecret || currentText === null) {
            await navigator.clipboard.writeText('');
            if (onCleared) onCleared();
          }
        } catch {
          // If readText fails due to permissions, blank clipboard anyway
          await navigator.clipboard.writeText('').catch(() => {});
          if (onCleared) onCleared();
        }
        lastCopiedSecret = null;
        activeTimer = null;
      }, timeoutSeconds * 1000);
    }

    return true;
  } catch (err) {
    // Fallback using textarea
    try {
      const el = document.createElement('textarea');
      el.value = text;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      return true;
    } catch {
      return false;
    }
  }
}
