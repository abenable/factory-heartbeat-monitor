import { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { isAuthed, isReporter, isSupervisor, isTechnician, isViewer } from "@/lib/auth";

function authRedirect(pathname: string, search: string) {
  const from = encodeURIComponent(pathname + search);
  return `/welcome?from=${from}`;
}

export function RequireAuth({ children }: { children: ReactNode }) {
  const location = useLocation();
  if (!isAuthed()) {
    return <Navigate to={authRedirect(location.pathname, location.search)} replace />;
  }
  return <>{children}</>;
}

export function RequireSupervisor({ children }: { children: ReactNode }) {
  const location = useLocation();
  if (!isAuthed()) {
    return <Navigate to={authRedirect(location.pathname, location.search)} replace />;
  }
  if (!isSupervisor() && !isViewer()) {
    return <Navigate to="/technician" replace />;
  }
  return <>{children}</>;
}

export function RequireTechnician({ children }: { children: ReactNode }) {
  const location = useLocation();
  if (!isAuthed()) {
    return <Navigate to={authRedirect(location.pathname, location.search)} replace />;
  }
  if (!isTechnician()) {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
}

export function RequireReporter({ children }: { children: ReactNode }) {
  const location = useLocation();
  if (!isAuthed()) {
    return <Navigate to={authRedirect(location.pathname, location.search)} replace />;
  }
  if (!isReporter()) {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
}
