import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/components/ThemeProvider";
import { login, logout } from "@/lib/auth";

import Welcome from "@/pages/Welcome";
import LoginPage from "@/pages/Login";
import Index from "@/pages/Index";
import SupervisorDashboard from "@/pages/SupervisorDashboard";
import NotFound from "@/pages/NotFound";
import Machines from "@/pages/Machines";
import MachineDetail from "@/pages/MachineDetail";
import Alerts from "@/pages/Alerts";
import WorkOrders from "@/pages/WorkOrders";
import JobRequests from "@/pages/JobRequests";
import JobRequestDetail from "@/pages/JobRequestDetail";
import MaintenanceRequestForm from "@/pages/MaintenanceRequestForm";
import PMSchedule from "@/pages/PMSchedule";
import Backlog from "@/pages/Backlog";
import NewWorkOrder from "@/pages/NewWorkOrder";
import RCA from "@/pages/RCA";
import MachineForm from "@/pages/MachineForm";
import MaterialControl from "@/pages/MaterialControl";
import PerformanceReports from "@/pages/PerformanceReports";
import CraftsmenManagement from "@/pages/CraftsmenManagement";
import Profile from "@/pages/Profile";
import TechnicianDashboard from "@/pages/TechnicianDashboard";
import TechnicianPerformance from "@/pages/TechnicianPerformance";
import TechnicianProgress from "@/pages/TechnicianProgress";
import ReportRequest from "@/pages/ReportRequest";

const MACHINE_ID = "MS-TUBE-01";
const JOB_REQUEST_ID = "JR-1042";
const MRF_ID = "KMC-MRF-2026-0001";

function renderRoute(path: string, routePath: string, element: React.ReactElement, asUser?: string) {
  logout();
  if (asUser) login(asUser, "Angel");
  return render(
    <ThemeProvider>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path={routePath} element={element} />
        </Routes>
      </MemoryRouter>
    </ThemeProvider>,
  );
}

describe("full route audit — every page must render without throwing", () => {
  it("Welcome", () => {
    expect(() => renderRoute("/welcome", "/welcome", <Welcome />)).not.toThrow();
  });

  it("Login", () => {
    expect(() => renderRoute("/login", "/login", <LoginPage />)).not.toThrow();
  });

  it("NotFound", () => {
    expect(() => renderRoute("/nope", "*", <NotFound />)).not.toThrow();
  });

  // ── Supervisor-role pages ──
  const sup = "Suubi";

  it("SupervisorDashboard", () => {
    expect(() => renderRoute("/", "/", <SupervisorDashboard />, sup)).not.toThrow();
  });

  it("Machines", () => {
    expect(() => renderRoute("/machines", "/machines", <Machines />, sup)).not.toThrow();
  });

  it("MachineForm (new)", () => {
    expect(() => renderRoute("/machines/new", "/machines/new", <MachineForm />, sup)).not.toThrow();
  });

  it("MachineForm (edit)", () => {
    expect(() =>
      renderRoute(`/machines/${MACHINE_ID}/edit`, "/machines/:id/edit", <MachineForm />, sup),
    ).not.toThrow();
  });

  it("MachineDetail", () => {
    expect(() =>
      renderRoute(`/machines/${MACHINE_ID}`, "/machines/:id", <MachineDetail />, sup),
    ).not.toThrow();
  });

  it("Alerts", () => {
    expect(() => renderRoute("/alerts", "/alerts", <Alerts />, sup)).not.toThrow();
  });

  it("JobRequests", () => {
    expect(() => renderRoute("/job-requests", "/job-requests", <JobRequests />, sup)).not.toThrow();
  });

  it("JobRequestDetail", () => {
    expect(() =>
      renderRoute(`/job-requests/${JOB_REQUEST_ID}`, "/job-requests/:id", <JobRequestDetail />, sup),
    ).not.toThrow();
  });

  it("MaintenanceRequestForm via /job-requests/maintenance/:id (supervisor)", () => {
    expect(() =>
      renderRoute(
        `/job-requests/maintenance/${MRF_ID}`,
        "/job-requests/maintenance/:id",
        <MaintenanceRequestForm />,
        sup,
      ),
    ).not.toThrow();
  });

  it("WorkOrders", () => {
    expect(() => renderRoute("/work-orders", "/work-orders", <WorkOrders />, sup)).not.toThrow();
  });

  it("NewWorkOrder", () => {
    expect(() => renderRoute("/work-orders/new", "/work-orders/new", <NewWorkOrder />, sup)).not.toThrow();
  });

  it("TechnicianProgress", () => {
    expect(() =>
      renderRoute("/technician-progress", "/technician-progress", <TechnicianProgress />, sup),
    ).not.toThrow();
  });

  it("RCA", () => {
    expect(() => renderRoute("/rca", "/rca", <RCA />, sup)).not.toThrow();
  });

  it("Backlog", () => {
    expect(() => renderRoute("/backlog", "/backlog", <Backlog />, sup)).not.toThrow();
  });

  it("PMSchedule", () => {
    expect(() => renderRoute("/maintenance", "/maintenance", <PMSchedule />, sup)).not.toThrow();
  });

  it("MaterialControl", () => {
    expect(() =>
      renderRoute("/material-control", "/material-control", <MaterialControl />, sup),
    ).not.toThrow();
  });

  it("CraftsmenManagement (Man Power)", () => {
    expect(() =>
      renderRoute("/craftsmen-management", "/craftsmen-management", <CraftsmenManagement />, sup),
    ).not.toThrow();
  });

  it("PerformanceReports", () => {
    expect(() =>
      renderRoute("/performance-reports", "/performance-reports", <PerformanceReports />, sup),
    ).not.toThrow();
  });

  it("Profile (supervisor)", () => {
    expect(() => renderRoute("/profile", "/profile", <Profile />, sup)).not.toThrow();
  });

  // ── Technician-role pages ──
  const tech = "Mukisa";

  it("TechnicianDashboard", () => {
    expect(() => renderRoute("/technician", "/technician", <TechnicianDashboard />, tech)).not.toThrow();
  });

  it("TechnicianPerformance", () => {
    expect(() =>
      renderRoute("/technician/performance", "/technician/performance", <TechnicianPerformance />, tech),
    ).not.toThrow();
  });

  // ── Reporter-role pages (line operator console) ──
  const rep = "Asiimwe";

  it("MaintenanceRequestForm — /report (create mode)", () => {
    expect(() => renderRoute("/report", "/report", <MaintenanceRequestForm />, rep)).not.toThrow();
  });

  it("ReportRequest — /report/requests (My Requests)", () => {
    expect(() => renderRoute("/report/requests", "/report/requests", <ReportRequest />, rep)).not.toThrow();
  });

  it("MaintenanceRequestForm — /report/maintenance/new", () => {
    expect(() =>
      renderRoute("/report/maintenance/new", "/report/maintenance/new", <MaintenanceRequestForm />, rep),
    ).not.toThrow();
  });

  it("MaintenanceRequestForm — /report/maintenance/:id (view mode)", () => {
    expect(() =>
      renderRoute(
        `/report/maintenance/${MRF_ID}`,
        "/report/maintenance/:id",
        <MaintenanceRequestForm />,
        rep,
      ),
    ).not.toThrow();
  });

  // ── Viewer-role fallback ──
  const viewer = "Tumusiime";

  it("Index (legacy dashboard, viewer fallback)", () => {
    expect(() => renderRoute("/", "/", <Index />, viewer)).not.toThrow();
  });

  it("Machines as viewer (read-only)", () => {
    expect(() => renderRoute("/machines", "/machines", <Machines />, viewer)).not.toThrow();
  });
});
