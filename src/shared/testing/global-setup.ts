import { afterEach, beforeEach } from "vitest";

function clearStorage() {
  localStorage.clear();
  sessionStorage.clear();
}

beforeEach(clearStorage);
afterEach(clearStorage);
