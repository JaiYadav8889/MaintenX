import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { MaintenxLayout } from "./components/MaintenxLayout";

// Import MaintenX feature pages
import DashboardOverview from "./pages/DashboardOverview";
import FleetMonitoring from "./pages/FleetMonitoring";
import MachineDetail from "./pages/MachineDetail";
import PredictiveInsights from "./pages/PredictiveInsights";
import AlertCenter from "./pages/AlertCenter";
import MaintenanceWorkspace from "./pages/MaintenanceWorkspace";
import DataCenter from "./pages/DataCenter";
import Analytics from "./pages/Analytics";
import SimulationDemo from "./pages/SimulationDemo";

function Router() {
  return (
    <MaintenxLayout>
      <Switch>
        <Route path="/" component={DashboardOverview} />
        <Route path="/fleet" component={FleetMonitoring} />
        <Route path="/machine/:id" component={MachineDetail} />
        <Route path="/insights" component={PredictiveInsights} />
        <Route path="/alerts" component={AlertCenter} />
        <Route path="/maintenance" component={MaintenanceWorkspace} />
        <Route path="/datasets" component={DataCenter} />
        <Route path="/analytics" component={Analytics} />
        <Route path="/simulation" component={SimulationDemo} />
        <Route path="/404" component={NotFound} />
        <Route component={NotFound} />
      </Switch>
    </MaintenxLayout>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <Toaster position="top-right" />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
