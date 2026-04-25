import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/ThemeProvider";
import { RequireAuth } from "@/components/RequireAuth";
import Index from "./pages/Index.tsx";
import NotFound from "./pages/NotFound.tsx";
import Machines from "./pages/Machines.tsx";
import MachineDetail from "./pages/MachineDetail.tsx";
import Alerts from "./pages/Alerts.tsx";
import WorkOrders from "./pages/WorkOrders.tsx";
import PMSchedule from "./pages/PMSchedule.tsx";
import Reports from "./pages/Reports.tsx";
import Backlog from "./pages/Backlog.tsx";
import Login from "./pages/Login.tsx";
import NewWorkOrder from "./pages/NewWorkOrder.tsx";
import RCA from "./pages/RCA.tsx";
import MachineForm from "./pages/MachineForm.tsx";
import MaterialControl from "./pages/MaterialControl.tsx";
import PerformanceReports from "./pages/PerformanceReports.tsx";
import CraftsmenManagement from "./pages/CraftsmenManagement.tsx";
import Profile from "./pages/Profile.tsx";

const queryClient = new QueryClient();

const App = () => (
  <ThemeProvider>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<RequireAuth><Index /></RequireAuth>} />
            <Route path="/machines" element={<RequireAuth><Machines /></RequireAuth>} />
            <Route path="/machines/new" element={<RequireAuth><MachineForm /></RequireAuth>} />
            <Route path="/machines/:id/edit" element={<RequireAuth><MachineForm /></RequireAuth>} />
            <Route path="/machines/:id" element={<RequireAuth><MachineDetail /></RequireAuth>} />
            <Route path="/alerts" element={<RequireAuth><Alerts /></RequireAuth>} />
            <Route path="/work-orders" element={<RequireAuth><WorkOrders /></RequireAuth>} />
            <Route path="/work-orders/new" element={<RequireAuth><NewWorkOrder /></RequireAuth>} />
            <Route path="/rca" element={<RequireAuth><RCA /></RequireAuth>} />
            <Route path="/backlog" element={<RequireAuth><Backlog /></RequireAuth>} />
            <Route path="/maintenance" element={<RequireAuth><PMSchedule /></RequireAuth>} />
            <Route path="/material-control" element={<RequireAuth><MaterialControl /></RequireAuth>} />
            <Route path="/craftsmen-management" element={<RequireAuth><CraftsmenManagement /></RequireAuth>} />
            <Route path="/performance-reports" element={<RequireAuth><PerformanceReports /></RequireAuth>} />
            <Route path="/reports" element={<RequireAuth><Reports /></RequireAuth>} />
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
