export function saveFile(file: Blob, fileName: string): void {
  const url = URL.createObjectURL(file);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;

  link.click();
  // Browsers resolve the blob URL when the download starts, during the click,
  // so the download keeps its file after the URL is revoked.
  URL.revokeObjectURL(url);
}
