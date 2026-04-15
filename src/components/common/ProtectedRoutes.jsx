import { Navigate } from "react-router-dom";
import { useAuth } from "../../context/Authcontext";

export default function ProtectedRoute({ children, role }) {
  const { user, loading } = useAuth();

  // ✅ Loading khatam hone tak wait karo
  if (loading) return null;

  // ✅ Login nahi hai toh login page par bhejo
  if (!user) return <Navigate to="/login" replace />;

  // ✅ Role check
  if (role && user.role !== role) return <Navigate to="/pos" replace />;

  return children;
}