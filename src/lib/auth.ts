// Simple client-side auth for demo purposes only.
// NOTE: Hardcoded credentials per project requirements. Not for production.
import { ALLOWED_USERNAMES, WORKERS } from "@/data/workers";

const KEY = "g6-auth";
const PASS = "Angel";

function normalize(u: string) {
  return u.trim().toLowerCase();
}

export function login(username: string, password: string): boolean {
  const u = normalize(username);
  const match = ALLOWED_USERNAMES.find((n) => n.toLowerCase() === u);
  if (match && password === PASS) {
    sessionStorage.setItem(KEY, match);
    return true;
  }
  return false;
}

export function logout() {
  sessionStorage.removeItem(KEY);
}

export function getUser(): string | null {
  return sessionStorage.getItem(KEY);
}

export function isAuthed(): boolean {
  return !!getUser();
}

/** True when the signed-in user is a read-only viewer (e.g. shareholder).
 *  Such users may not create, edit or delete operational records, but may
 *  still update their own contact details on their profile. */
export function isViewer(): boolean {
  const u = getUser();
  if (!u) return false;
  return Boolean(WORKERS[u]?.viewer);
}
