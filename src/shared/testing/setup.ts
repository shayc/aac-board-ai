import { reloadPersistedStores } from "@shared/state/persisted-store";
import { afterEach, beforeEach, vi } from "vitest";

// Keep tests independent of the browser's installed AI models.
const BUILT_IN_AI_NAMESPACES = ["Proofreader", "Rewriter", "Translator"];

function clearStorage() {
  localStorage.clear();
  sessionStorage.clear();
}

beforeEach(() => {
  for (const namespace of BUILT_IN_AI_NAMESPACES) {
    vi.stubGlobal(namespace, undefined);
  }
  clearStorage();
  // Module-scoped stores survive localStorage.clear().
  reloadPersistedStores();
});
afterEach(clearStorage);
