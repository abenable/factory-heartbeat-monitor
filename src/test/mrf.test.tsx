import { describe, expect, it, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "../components/ThemeProvider.tsx";
import MaintenanceRequestForm from "../pages/MaintenanceRequestForm.tsx";
import { login, logout } from "../lib/auth.ts";

function Wrapper({ children, initial = "/" }: { children: React.ReactNode; initial?: string }) {
  return (
    <ThemeProvider>
      <MemoryRouter initialEntries={[initial]}>{children}</MemoryRouter>
    </ThemeProvider>
  );
}

describe("maintenance request form", () => {
  beforeEach(() => {
    logout();
  });

  it("renders the create form for a reporter", () => {
    login("Asiimwe", "Angel");
    render(
      <Wrapper initial="/report/maintenance/new">
        <Routes>
          <Route path="/report/maintenance/new" element={<MaintenanceRequestForm />} />
        </Routes>
      </Wrapper>,
    );
    expect(screen.getByText(/New Maintenance Request/i)).toBeInTheDocument();
    expect(screen.getByText(/Supervisor Approval/i)).toBeInTheDocument();
  });
});
