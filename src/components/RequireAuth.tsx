import { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { isAuthed } from "@/lib/auth";

export function RequireAuth({ children }: { children: ReactNode }) {
  const location = useLocation();
  if (!isAuthed()) {
    const from = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/welcome?from=${from}`} replace />;
  }
  return <>{children}</>;
}
