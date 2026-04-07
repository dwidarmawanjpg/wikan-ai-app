import { Routes, Route } from "react-router-dom";
import Home from "./pages/home";
import Login from "./pages/login";
import RegisterUser from "./pages/register-user";
import RegisterContributor from "./pages/register-contributor";
import Dashboard from "./pages/dashboard";
import DashboardContributor from "./pages/dashboard-contributor";
import DashboardAdmin from "./pages/dashboard-admin";
import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      
      <Route path="/login" element={<Login />} />
      
      <Route path="/register-user" element={<RegisterUser />} />

      <Route path="/register-contributor" element={<RegisterContributor />} />

      <Route path="/dashboard" element={<Dashboard />} />

      {/* Protected Routes: Hanya Contributor */}
      <Route element={<ProtectedRoute allowedRoles={["CONTRIBUTOR"]} />}>
        <Route path="/dashboard-contributor" element={<DashboardContributor />} />
      </Route>

      {/* Protected Routes: Hanya Admin */}
      <Route element={<ProtectedRoute allowedRoles={["ADMIN"]} />}>
        <Route path="/dashboard-admin" element={<DashboardAdmin />} />
      </Route>

    </Routes>
  );
}

export default App;