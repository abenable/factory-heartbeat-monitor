import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/ThemeProvider";
import { RequireAuth, RequireSupervisor, RequireTechnician } from "@/components/RoleGuard";
import { isSupervisor, isTechnician } from "@/lib/auth";
import Welcome from "./pages/Welcome.tsx";
import Index from "./pages/Index.tsx";
import SupervisorDashboard from "./pages/SupervisorDashboard.tsx";
import NotFound from "./pages/NotFound.tsx";
import Machines from "./pages/Machines.tsx";
import MachineDetail from "./pages/MachineDetail.tsx";
import Alerts from "./pages/Alerts.tsx";
import WorkOrders from "./pages/WorkOrders.tsx";
import PMSchedule from "./pages/PMSchedule.tsx";
import Backlog from "./pages/Backlog.tsx";
import Login from "./pages/Login.tsx";
import NewWorkOrder from "./pages/NewWorkOrder.tsx";
import RCA from "./pages/RCA.tsx";
import MachineForm from "./pages/MachineForm.tsx";
import MaterialControl from "./pages/MaterialControl.tsx";
import PerformanceReports from "./pages/PerformanceReports.tsx";
import CraftsmenManagement from "./pages/CraftsmenManagement.tsx";
import Profile from "./pages/Profile.tsx";
import TechnicianDashboard from "./pages/TechnicianDashboard.tsx";

const queryClient = new QueryClient();

function RoleHome() {
  if (isTechnician()) return <Navigate to="/technician" replace />;
  if (isSupervisor()) return <SupervisorDashboard />;
  return <Index />; // viewers / fallback still land on the legacy dashboard (read-only)
}

const App = () => (
  <ThemeProvider>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/welcome" element={<Welcome />} />
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<RequireAuth><RoleHome /></RequireAuth>} />
            <Route path="/technician" element={<RequireTechnician><TechnicianDashboard /></RequireTechnician>} />
            <Route path="/machines" element={<RequireSupervisor><Machines /></RequireSupervisor>} />
            <Route path="/machines/new" element={<RequireSupervisor><MachineForm /></RequireSupervisor>} />
            <Route path="/machines/:id/edit" element={<RequireSupervisor><MachineForm /></RequireSupervisor>} />
            <Route path="/machines/:id" element={<RequireSupervisor><MachineDetail /></RequireSupervisor>} />
            <Route path="/alerts" element={<RequireSupervisor><Alerts /></RequireSupervisor>} />
            <Route path="/work-orders" element={<RequireSupervisor><WorkOrders /></RequireSupervisor>} />
            <Route path="/work-orders/new" element={<RequireSupervisor><NewWorkOrder /></RequireSupervisor>} />
            <Route path="/rca" element={<RequireSupervisor><RCA /></RequireSupervisor>} />
            <Route path="/backlog" element={<RequireSupervisor><Backlog /></RequireSupervisor>} />
            <Route path="/maintenance" element={<RequireSupervisor><PMSchedule /></RequireSupervisor>} />
            <Route path="/material-control" element={<RequireSupervisor><MaterialControl /></RequireSupervisor>} />
            <Route path="/craftsmen-management" element={<RequireSupervisor><CraftsmenManagement /></RequireSupervisor>} />
            <Route path="/performance-reports" element={<RequireSupervisor><PerformanceReports /></RequireSupervisor>} />
            <Route path="/profile" element={<RequireAuth><Profile /></RequireAuth>} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ThemeProvider>
);

export default App;
