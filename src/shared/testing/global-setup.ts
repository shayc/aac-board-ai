import { reloadPersistedStores } from "@shared/utils/persisted-store";
import { afterEach, beforeEach, vi } from "vitest";

// Built-in AI namespaces the app reads off globalThis. Their ambient state can
// differ between local and CI Chromium, so default them to absent; tests opt in
// with the stub helpers in stub-built-in-ai.ts.
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
  // Clearing storage does not reset module-scoped stores. Reloading restores
  // their defaults and persists them again.
  reloadPersistedStores();
});
afterEach(clearStorage);
