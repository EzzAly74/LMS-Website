/**
 * Copy text to the clipboard. Resolves `true` when it was copied.
 *
 * `navigator.clipboard` exists only in a secure context (HTTPS or localhost);
 * on the plain-HTTP test server it is undefined, so "Copy link" did nothing
 * (NEW2B-5900). The fallback is a hidden textarea and `execCommand('copy')`,
 * deprecated but still the only way on an insecure origin. It runs inside the
 * click, which is the user gesture the browser requires.
 */
export async function copyText(text: string): Promise<boolean> {
  if (window.isSecureContext && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Permission denied or document not focused: try the fallback.
    }
  }
  return copyWithTextarea(text);
}

function copyWithTextarea(text: string): boolean {
  const area = document.createElement('textarea');
  area.value = text;
  area.setAttribute('readonly', '');
  area.style.position = 'fixed';
  area.style.insetBlockStart = '0';
  area.style.opacity = '0';
  document.body.appendChild(area);
  const active = document.activeElement as HTMLElement | null;
  area.select();
  try {
    return document.execCommand('copy');
  } catch {
    return false;
  } finally {
    area.remove();
    active?.focus();
  }
}
