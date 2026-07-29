// Simple client-side auth for demo purposes only.
// NOTE: Hardcoded credentials per project requirements. Not for production.
import { ALLOWED_USERNAMES, getWorker, WORKERS } from "@/data/workers";

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

export type UserRole = "supervisor" | "technician" | "viewer" | "reporter";

export function getUserRole(): UserRole | null {
  const u = getUser();
  if (!u) return null;
  const worker = getWorker(u);
  if (worker?.role) return worker.role;
  const title = worker?.jobTitle.toLowerCase() ?? "";
  const supervisorTitles = ["supervisor", "planner", "engineer", "officer", "manager"];
  return supervisorTitles.some((t) => title.includes(t)) ? "supervisor" : "technician";
}

export function isSupervisor(): boolean {
  return getUserRole() === "supervisor";
}

export function isTechnician(): boolean {
  return getUserRole() === "technician";
}

export function isReporter(): boolean {
  return getUserRole() === "reporter";
}

/** True when the signed-in user is a read-only viewer (e.g. shareholder).
 *  Such users may not create, edit or delete operational records, but may
 *  still update their own contact details on their profile. */
export function isViewer(): boolean {
  return getUserRole() === "viewer";
}
