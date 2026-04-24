import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/ThemeProvider";
import Index from "./pages/Index.tsx";
import NotFound from "./pages/NotFound.tsx";
import Machines from "./pages/Machines.tsx";
import MachineDetail from "./pages/MachineDetail.tsx";
import Alerts from "./pages/Alerts.tsx";
import WorkOrders from "./pages/WorkOrders.tsx";
import PMSchedule from "./pages/PMSchedule.tsx";
import Reports from "./pages/Reports.tsx";
import Backlog from "./pages/Backlog.tsx";

const queryClient = new QueryClient();

const App = () => (
  <ThemeProvider>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/machines" element={<Machines />} />
            <Route path="/machines/:id" element={<MachineDetail />} />
            <Route path="/alerts" element={<Alerts />} />
            <Route path="/work-orders" element={<WorkOrders />} />
            <Route path="/backlog" element={<Backlog />} />
            <Route path="/maintenance" element={<PMSchedule />} />
            <Route path="/reports" element={<Reports />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ThemeProvider>
);

export default App;
