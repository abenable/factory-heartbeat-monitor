import { describe, expect, it, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "../components/ThemeProvider.tsx";
import Welcome from "../pages/Welcome.tsx";
import Login from "../pages/Login.tsx";
import SupervisorDashboard from "../pages/SupervisorDashboard.tsx";
import JobRequests from "../pages/JobRequests.tsx";
import JobRequestDetail from "../pages/JobRequestDetail.tsx";
import { login, logout } from "../lib/auth.ts";

function Wrapper({ children, initial = "/" }: { children: React.ReactNode; initial?: string }) {
  return (
    <ThemeProvider>
      <MemoryRouter initialEntries={[initial]}>{children}</MemoryRouter>
    </ThemeProvider>
  );
}

describe("app smoke", () => {
  beforeEach(() => {
    logout();
  });

  it("renders welcome page", () => {
    render(
      <Wrapper initial="/welcome">
        <Welcome />
      </Wrapper>,
    );
    expect(screen.getAllByText(/Kiira Motors Corporation/i).length).toBeGreaterThan(0);
  });

  it("renders login page", () => {
    render(
      <Wrapper initial="/login">
        <Login />
      </Wrapper>,
    );
    expect(screen.getByLabelText(/User name/i)).toBeInTheDocument();
  });

  it("renders supervisor dashboard", () => {
    render(
      <Wrapper initial="/">
        <SupervisorDashboard />
      </Wrapper>,
    );
    expect(screen.getByRole("heading", { name: /Live Dashboard/i })).toBeInTheDocument();
  });

  it("renders job requests list", () => {
    render(
      <Wrapper initial="/job-requests">
        <JobRequests />
      </Wrapper>,
    );
    expect(screen.getByText(/INCOMING REQUESTS/i)).toBeInTheDocument();
  });

  it("renders job request detail", () => {
    render(
      <Wrapper initial="/job-requests/JR-1042">
        <Routes>
          <Route path="/job-requests/:id" element={<JobRequestDetail />} />
        </Routes>
      </Wrapper>,
    );
    expect(screen.getByText(/Unusual knocking sound/i)).toBeInTheDocument();
  });

  it("can log in", () => {
    expect(login("Suubi", "Angel")).toBe(true);
    logout();
  });
});
