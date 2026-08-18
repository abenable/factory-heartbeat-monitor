import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/components/ThemeProvider";
import { PrintableWorkOrder } from "@/components/PrintableWorkOrder";
import { PrintablePMChecklist } from "@/components/PrintablePMChecklist";
import { PrintableMaintenanceRequest } from "@/components/PrintableMaintenanceRequest";
import { workOrders, pmTasks } from "@/data/cmms";
import { maintenanceRequests } from "@/data/maintenanceRequests";
import MaintenanceRequestForm from "@/pages/MaintenanceRequestForm";
import { login, logout } from "@/lib/auth";

describe("print templates render without throwing", () => {
  it("PrintableWorkOrder for every seed work order", () => {
    for (const wo of workOrders) {
      expect(() =>
        render(
          <ThemeProvider>
            <PrintableWorkOrder wo={wo} />
          </ThemeProvider>,
        ),
      ).not.toThrow();
    }
  });

  it("PrintablePMChecklist for every seed PM task (checks the compacted 2-column layout renders all items)", () => {
    for (const task of pmTasks) {
      const { container } = render(
        <ThemeProvider>
          <PrintablePMChecklist task={task} />
        </ThemeProvider>,
      );
      const rows = container.querySelectorAll(".wo-print-check-row");
      expect(rows.length).toBe(task.checklist.length);
    }
  });

  it("PrintableMaintenanceRequest for the seed record", () => {
    expect(() =>
      render(
        <ThemeProvider>
          <PrintableMaintenanceRequest request={maintenanceRequests[0]} />
        </ThemeProvider>,
      ),
    ).not.toThrow();
  });

  it("draft Maintenance Request Form shows a real reference number, not DRAFT", () => {
    logout();
    login("Asiimwe", "Angel");
    const { container } = render(
      <ThemeProvider>
        <MemoryRouter initialEntries={["/report"]}>
          <Routes>
            <Route path="/report" element={<MaintenanceRequestForm />} />
          </Routes>
        </MemoryRouter>
      </ThemeProvider>,
    );
    const jobNoBox = container.querySelector(".mrf-jobno-value");
    expect(jobNoBox?.textContent).toMatch(/^KMC-MRF-\d{4}-\d{4}$/);
    expect(jobNoBox?.textContent).not.toBe("DRAFT");
  });
});
