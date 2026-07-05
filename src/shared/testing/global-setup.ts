import { resetPersistedStores } from "@shared/utils/persisted-store";
import { afterEach, beforeEach } from "vitest";

function clearStorage() {
  localStorage.clear();
  sessionStorage.clear();
}

beforeEach(() => {
  clearStorage();
  // Persisted stores snapshot localStorage at module import, so import order
  // can leak state between test files. Reloading here resets every store to
  // parse(undefined) regardless of import order. Note: setState() emits, so
  // each store's persist() subscriber immediately writes its parsed defaults
  // back into localStorage — storage isn't empty after this call, just reset.
  resetPersistedStores();
});
afterEach(clearStorage);
