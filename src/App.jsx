import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/Authcontext";
import { useAuth } from "./context/Authcontext";
import ProtectedRoute from "./components/common/ProtectedRoutes";
import Sidebar from "./components/layout/Sidebar";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import POS from "./pages/POS";
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

function AppLayout({ children }) {
  const { user, loading } = useAuth();

  if (loading) return (
    <div style={{
      minHeight: "100vh", display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      background: "#0f172a", gap: 16,
    }}>
      <div style={{
        width: 48, height: 48,
        border: "3px solid rgba(0,245,255,0.2)",
        borderTop: "3px solid #00f5ff",
        borderRadius: "50%",
        animation: "spin 0.8s linear infinite",
      }} />
      <p style={{ color: "#00f5ff", fontFamily: "monospace", letterSpacing: 3, fontSize: 13 }}>
        LOADING...
      </p>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  return (
    <div style={{ display: "flex" }}>
      {user && <Sidebar />}
      <div style={{
        marginLeft: user ? 220 : 0,
        flex: 1, minHeight: "100vh",
        background: "linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)",
        padding: user ? "20px 24px" : "0",
      }}>
        {children}
      </div>
    </div>
  );
}

function AppRoutes() {
  return (
    <AppLayout>
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