export function requestPersistentStorage(): void {
  if (!window.isSecureContext) {
    return;
  }

  // Not awaited: Firefox settles only once the user answers its prompt.
  void navigator.storage.persist();
}
