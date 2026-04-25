// Simple client-side auth for demo purposes only.
// NOTE: Hardcoded credentials per project requirements. Not for production.
const KEY = "g6-auth";
const USER = "Nakimbugwe";
const PASS = "Angel";

export function login(username: string, password: string): boolean {
  if (username.trim() === USER && password === PASS) {
    sessionStorage.setItem(KEY, username);
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
