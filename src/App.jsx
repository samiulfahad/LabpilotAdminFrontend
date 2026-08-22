import { useEffect } from "react";
import { Routes, Route, Navigate, Outlet } from "react-router-dom";
import { useAuthStore } from "./store/authStore";

import Login from "./pages/login";
import Layout from "./components/layout";
import Home from "./pages/home";
import Account from "./pages/account";
import Labs from "./pages/labs";
import LabManagement from "./pages/lab-management";
import TestCatalog from "./pages/testCatalog";
import SchemaEngine from "./pages/schemaEngine";
import SchemaBuilder from "./pages/schemaBuilder";
import Zones from "./pages/zones";
import ReportUpload from "./pages/reportUpload";
import ReportDownload from "./pages/reportDownload";
import AdminBilling from "./pages/billing";
import ManageSupportAdmins from "./pages/supportAdmin";
import LabStaff from "./pages/labStaff";
import SupportInbox from "./pages/supportInbox";

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
  const isInitializing = useAuthStore((s) => s.isInitializing);
  const initialize = useAuthStore((s) => s.initialize);

  // Access token lives in memory only (see authStore.js), so every fresh
  // page load starts with token: null. This re-derives it from the
  // httpOnly refresh cookie before any protected route is allowed to
  // render, so isAuthenticated always reflects a session actually
  // verified against the server — never a stale persisted flag.
  useEffect(() => {
    initialize();
  }, [initialize]);

  if (isInitializing) {
    return null; // session check in flight — swap for a splash/spinner if desired
  }

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
        <Route path="/lab-staffs" element={<LabStaff />} />
        <Route path="/support-admin" element={<ManageSupportAdmins />} />
        <Route path="/lab-management" element={<LabManagement />} />
        <Route path="/billing" element={<AdminBilling />} />
        <Route path="/test-catalog" element={<TestCatalog />} />
        <Route path="/schema-engine" element={<SchemaEngine />} />
        <Route path="/schema-builder" element={<SchemaBuilder />} />
        <Route path="/schema-builder/:schemaId" element={<SchemaBuilder />} />
        <Route path="/schema-renderer/:schemaId" element={<ReportUpload />} />
        <Route path="/report/:schemaId" element={<ReportDownload />} />
        <Route path="/support-inbox" element={<SupportInbox />} />
        <Route path="/zones" element={<Zones />} />
      </Route>

      {/* Catch-all: Redirect unknown URLs to home */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
