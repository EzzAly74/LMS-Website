/**
 * Hand a downloaded Blob to the browser as a file. Downloads go through
 * HttpClient (the bearer token and API base), so a plain <a href> cannot be used.
 */
export function saveBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
