export function downloadJson(filename: string, payload: unknown): void {
  const content = JSON.stringify(payload, null, 2);
  downloadBlob(filename, content, "application/json");
}

export function downloadText(filename: string, payload: string): void {
  downloadBlob(filename, payload, "text/plain;charset=utf-8");
}

function downloadBlob(
  filename: string,
  content: string,
  mimeType: string,
): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
