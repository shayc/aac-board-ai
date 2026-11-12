export function saveFile(file: Blob, fileName: string): void {
  const url = URL.createObjectURL(file);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;

  link.click();
  // The browser resolves the blob URL during the click, so the download
  // survives the revoke.
  URL.revokeObjectURL(url);
}
