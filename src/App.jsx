import { Routes, Route, Navigate, Outlet } from "react-router-dom";
import { useAuthStore } from "./store/authStore";

import Login from "./pages/login";
import Layout from "./components/layout";
import Home from "./pages/home";
import Account from "./pages/account";
import Labs from "./pages/labs";
import LabManagement from "./pages/lab-management";
import TestCatalog from "./pages/test-catalog";
import SchemaEngine from "./pages/schemaEngine";
import SchemaBuilder from "./pages/schemaBuilder";
import Zones from "./pages/zones";
import ReportUpload from "./pages/reportUpload";
import ReportDownload from "./pages/reportDownload";
import AdminBilling from "./pages/billing";

// ─── Route Wrapper for Protected Pages ──────────────────────────────────────
const ProtectedRoutes = () => {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  // If not logged in, kick them to the login page
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  // If logged in, show the Layout (Sidebar/Navbar) and the requested page
  return (
    <Layout>
      <Outlet />
    </Layout>
  );
};

// ─── Main App Component ─────────────────────────────────────────────────────
function App() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  return (
    <Routes>
      {/* ════ PUBLIC ROUTES (No login required) ════ */}
      {/* If already logged in, don't show the login page again */}
      <Route path="/login" element={isAuthenticated ? <Navigate to="/" replace /> : <Login />} />

      {/* ════ PROTECTED ROUTES (Login required) ════ */}
      {/* Single admin identity — no module gating, unlike LabPilot's
          RequireModules wrapper. Anyone with a valid session sees everything. */}
      <Route element={<ProtectedRoutes />}>
        <Route path="/" element={<Home />} />
        <Route path="/account" element={<Account />} />
        <Route path="/labs" element={<Labs />} />
        <Route path="/lab-management" element={<LabManagement />} />
        <Route path="/billing" element={<AdminBilling />} />
        <Route path="/test-catalog" element={<TestCatalog />} />
        <Route path="/schema-engine" element={<SchemaEngine />} />
        <Route path="/schema-builder" element={<SchemaBuilder />} />
        <Route path="/schema-builder/:schemaId" element={<SchemaBuilder />} />
        <Route path="/schema-renderer/:schemaId" element={<ReportUpload />} />
        <Route path="/report/:schemaId" element={<ReportDownload />} />
        <Route path="/zones" element={<Zones />} />
      </Route>

      {/* Catch-all: Redirect unknown URLs to home */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
