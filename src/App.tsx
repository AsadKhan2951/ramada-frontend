import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Login from "./pages/Login";
import SalesDashboard from "./pages/SalesDashboard";
import OperationsDashboard from "./pages/OperationsDashboard";
import FoodDashboard from "./pages/FoodDashboard";
import FinanceDashboard from "./pages/FinanceDashboard";
import CreateBooking from "./pages/CreateBooking";
import BookingDetails from "./pages/BookingDetails";
import ManageHalls from "./pages/ManageHalls";
import ManageMenus from "./pages/ManageMenus";
import ManageServices from "./pages/ManageServices";
import ManageUsers from "./pages/ManageUsers";
import SalesReports from "./pages/SalesReports";
import AdminReports from "./pages/AdminReports";

function Router() {
  return (
    <Switch>
      <Route path={"/"} component={Login} />
      <Route path={"/login"} component={Login} />
      <Route path={"/sales"} component={SalesDashboard} />
      <Route path={"/operations"} component={OperationsDashboard} />
      <Route path={"/food"} component={FoodDashboard} />
      <Route path={"/finance"} component={FinanceDashboard} />
      <Route path={"/booking/create"} component={CreateBooking} />
      <Route path={"/booking/:id"} component={BookingDetails} />
      <Route path={"/manage/halls"} component={ManageHalls} />
      <Route path={"/manage/menus"} component={ManageMenus} />
      <Route path={"/manage/services"} component={ManageServices} />
      <Route path={"/manage/users"} component={ManageUsers} />
      <Route path={"/sales/reports"} component={SalesReports} />
      <Route path={"/admin/reports"} component={AdminReports} />
      <Route path={"/404"} component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
