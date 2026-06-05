import type { AryState } from "../types";
import { cleanupState } from "./domain";
import { createSeedState } from "./seed";

const STORAGE_KEY = "ary-grs-001-local-poc";

export function loadState(): AryState {
  if (typeof window === "undefined") {
    return createSeedState();
  }

  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return createSeedState();
  }

  try {
    const parsed = JSON.parse(raw) as AryState;
    return cleanupState(parsed);
  } catch {
    return createSeedState();
  }
}

export function saveState(state: AryState): void {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function resetState(): AryState {
  const seed = createSeedState();
  saveState(seed);
  return seed;
}
