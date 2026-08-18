// This app has no backend — every mutable list (work orders, PM tasks,
// machines, job/maintenance requests) lives as a plain in-memory array that
// gets mutated in place. Without this, a page reload (or a technician and
// supervisor using separate browser sessions) silently resets everything
// back to the hardcoded seed data, making completed work look like it never
// happened. Persisting each array to localStorage — keyed by origin, so it
// survives reloads and is shared across tabs of the same browser — closes
// that gap without needing a real backend.
const STORAGE_PREFIX = "kmc-cmms-store:";

/** Mutates `arr` in place with any persisted copy, preserving its object
 *  identity — every importer already holds a reference to this exact array
 *  and expects mutation, not reassignment, to be how updates propagate. */
export function hydrateFromStorage<T>(key: string, arr: T[]): void {
  if (typeof localStorage === "undefined") return;
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + key);
    if (!raw) return;
    const saved = JSON.parse(raw);
    if (Array.isArray(saved)) {
      arr.length = 0;
      arr.push(...saved);
    }
  } catch {
    // Corrupt or unavailable storage — fall back to the seed data.
  }
}

/** Persists the current contents of `arr` so they survive a page reload. */
export function persistToStorage<T>(key: string, arr: T[]): void {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(arr));
  } catch {
    // Storage full/unavailable — in-memory state still works this session.
  }
}
