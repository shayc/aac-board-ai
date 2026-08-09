import { reloadPersistedStores } from "@shared/utils/persisted-store";
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
  // Persisted stores read localStorage at module import, so test-file import
  // order can leak state. Reload every store from parse(undefined) to remove
  // that dependency. Because setState() notifies persist() subscribers,
  // localStorage is repopulated with parsed defaults—reset, not emptied.
  reloadPersistedStores();
});
afterEach(clearStorage);
