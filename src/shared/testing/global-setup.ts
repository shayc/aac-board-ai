import { resetPersistedStores } from "@shared/utils/persisted-store";
import { afterEach, beforeEach, vi } from "vitest";

// Built-in AI namespaces the app reads off globalThis. Their ambient state can
// differ between local and CI Chromium, so default them to absent; tests opt in
// with the stub helpers in built-in-ai.ts.
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
  // Persisted stores snapshot localStorage at module import, so import order
  // can leak state between test files. Reloading here resets every store to
  // parse(undefined) regardless of import order. Note: setState() emits, so
  // each store's persist() subscriber immediately writes its parsed defaults
  // back into localStorage — storage isn't empty after this call, just reset.
  resetPersistedStores();
});
afterEach(clearStorage);
