// Simple client-side auth for demo purposes only.
// NOTE: Hardcoded credentials per project requirements. Not for production.
import { ALLOWED_USERNAMES } from "@/data/workers";

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
