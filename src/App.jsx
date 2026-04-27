import { BrowserRouter, Routes, Route, Navigate,useLocation } from "react-router-dom";
import { AuthProvider } from "./context/Authcontext";
import { useAuth } from "./context/Authcontext";
import ProtectedRoute from "./components/common/ProtectedRoutes";
import Sidebar from "./components/layout/Sidebar";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import POS from "./pages/pos";
import Receipt from "./pages/Receipt";
import SalesHistory from "./pages/SalesHistory";
import SaleDetails from "./pages/SalesDetail";
import Reports from "./pages/Report";
import StoreSettings from "./pages/admin/StoreSetting";
import ProductsAdmin from "./pages/admin/ProductsAdmin";
import CategoriesAdmin from "./pages/admin/CategoraiesAdmin";
import UsersAdmin from "./pages/admin/UsersAdmin";

function LoginRoute() {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) return <Navigate to="/dashboard" replace />;
  return <Login />;
}

function AppLayout({ children, isPOS }) {
  const { user, loading } = useAuth();

  if (loading) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#0f172a" }}>
      <div style={{ width: 48, height: 48, border: "3px solid rgba(0,245,255,0.2)", borderTop: "3px solid #00f5ff", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      {user && <Sidebar />}
      <div style={{
        marginLeft: user ? 220 : 0,
        flex: 1,
        minHeight: "100vh",
        background: "linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)",
        // ✅ POS page pe padding 0, baqi pages pe normal
        padding: isPOS ? 0 : "20px 24px",
        display: "flex",
        flexDirection: "column",
      }}>
        {children}
      </div>
    </div>
  );
}
function AppRoutes() {
  const location = useLocation();
  const isPOS = location.pathname === "/pos";

  return (
    <AppLayout isPOS={isPOS}>
      <Routes>
        <Route path="/login" element={<LoginRoute />} />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/pos" element={<ProtectedRoute><POS /></ProtectedRoute>} />
        <Route path="/receipt/:saleId" element={<ProtectedRoute><Receipt /></ProtectedRoute>} />
        <Route path="/sales" element={<ProtectedRoute><SalesHistory /></ProtectedRoute>} />
        <Route path="/sales/:id" element={<ProtectedRoute><SaleDetails /></ProtectedRoute>} />
        <Route path="/admin/reports" element={<ProtectedRoute role="admin"><Reports /></ProtectedRoute>} />
        <Route path="/admin/products" element={<ProtectedRoute role="admin"><ProductsAdmin /></ProtectedRoute>} />
        <Route path="/admin/categories" element={<ProtectedRoute role="admin"><CategoriesAdmin /></ProtectedRoute>} />
        <Route path="/admin/settings" element={<ProtectedRoute role="admin"><StoreSettings /></ProtectedRoute>} />
        <Route path="/admin/users" element={<ProtectedRoute role="admin"><UsersAdmin /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </AppLayout>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}