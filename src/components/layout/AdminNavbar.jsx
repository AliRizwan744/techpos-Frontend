import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/Authcontext";

const navItems = [
  { label: "Dashboard", icon: "🏠", path: "/pos" },
  { label: "Products", icon: "📦", path: "/admin/products" },
  { label: "Categories", icon: "🗂", path: "/admin/categories" },
  { label: "Sales", icon: "🧾", path: "/sales" },
  { label: "Reports", icon: "📊", path: "/admin/reports" },
  { label: "Users", icon: "👥", path: "/admin/users" },
  { label: "Settings", icon: "⚙️", path: "/admin/settings" },
];

const cashierItems = [
  { label: "POS", icon: "🛒", path: "/pos" },
  { label: "Sales", icon: "🧾", path: "/sales" },
];

// cartCount aur onCartClick POS se pass hoga
export default function AdminNavbar({ cartCount = 0, onCartClick }) {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate("/login"); };
  const items = isAdmin ? navItems : cashierItems;

  return (
    <>
      <div style={styles.sidebar}>
        {/* Logo + Bag Icon */}
        <div style={styles.logo}>
          <span style={styles.logoIcon}>🖥</span>
          <span style={styles.logoText}>Tech POS</span>

          {/* 🛍 Bag Icon - sirf POS page pr relevant */}
          {onCartClick && (
            <button onClick={onCartClick} style={styles.bagBtn}>
              🛍
              {cartCount > 0 && (
                <span style={styles.badge}>{cartCount}</span>
              )}
            </button>
          )}
        </div>

        {/* User Info */}
        <div style={styles.userBox}>
          <div style={styles.avatar}>{user?.name?.charAt(0).toUpperCase()}</div>
          <div>
            <p style={styles.userName}>{user?.name}</p>
            <p style={styles.userRole}>{user?.role === "admin" ? "Admin" : "Cashier"}</p>
          </div>
        </div>

        <div style={styles.divider} />

        {/* Nav Links */}
        <nav style={styles.nav}>
          {items.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              style={({ isActive }) => ({
                ...styles.navItem,
                backgroundColor: isActive ? "rgba(255,255,255,0.12)" : "transparent",
                color: isActive ? "#fff" : "rgba(255,255,255,0.65)",
              })}
            >
              <span style={styles.navIcon}>{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div style={styles.bottom}>
          <div style={styles.divider} />
          <button onClick={handleLogout} style={styles.logoutBtn}>
            <span style={styles.navIcon}>🚪</span>
            <span>Logout</span>
          </button>
        </div>
      </div>
      <div style={styles.spacer} />
    </>
  );
}

const styles = {
  sidebar: {
    position: "fixed", top: 0, left: 0,
    width: 220, height: "100vh",
    backgroundColor: "#0f172a",
    display: "flex", flexDirection: "column",
    zIndex: 100, boxShadow: "2px 0 12px rgba(0,0,0,0.3)",
  },
  spacer: { width: 220, flexShrink: 0 },
  logo: {
    display: "flex", alignItems: "center",
    gap: 10, padding: "24px 20px 16px",
    position: "relative",
  },
  logoIcon: { fontSize: 22 },
  logoText: { color: "#fff", fontSize: 18, fontWeight: "bold", letterSpacing: 0.5, flex: 1 },
  bagBtn: {
    position: "relative", background: "rgba(255,255,255,0.1)",
    border: "none", borderRadius: 8, padding: "6px 8px",
    cursor: "pointer", fontSize: 18, color: "#fff",
    display: "flex", alignItems: "center",
  },
  badge: {
    position: "absolute", top: -6, right: -6,
    backgroundColor: "#ef4444", color: "#fff",
    borderRadius: "50%", width: 18, height: 18,
    fontSize: 11, fontWeight: "bold",
    display: "flex", alignItems: "center", justifyContent: "center",
  },
  userBox: {
    display: "flex", alignItems: "center", gap: 10,
    padding: "12px 20px", backgroundColor: "rgba(255,255,255,0.06)",
    margin: "0 12px", borderRadius: 10,
  },
  avatar: {
    width: 36, height: 36, borderRadius: "50%",
    backgroundColor: "#2563eb", color: "#fff",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontWeight: "bold", fontSize: 16, flexShrink: 0,
  },
  userName: { color: "#fff", fontSize: 13, fontWeight: "600", margin: 0 },
  userRole: { color: "rgba(255,255,255,0.5)", fontSize: 11, margin: 0 },
  divider: { height: 1, backgroundColor: "rgba(255,255,255,0.08)", margin: "12px 0" },
  nav: { display: "flex", flexDirection: "column", gap: 2, padding: "0 10px", flex: 1 },
  navItem: {
    display: "flex", alignItems: "center", gap: 10,
    padding: "10px 14px", borderRadius: 8,
    textDecoration: "none", fontSize: 14, fontWeight: "500",
  },
  navIcon: { fontSize: 16, width: 20, textAlign: "center" },
  bottom: { padding: "0 10px 16px" },
  logoutBtn: {
    display: "flex", alignItems: "center", gap: 10,
    width: "100%", padding: "10px 14px",
    backgroundColor: "transparent", color: "rgba(255,255,255,0.65)",
    border: "none", borderRadius: 8, fontSize: 14,
    fontWeight: "500", cursor: "pointer", textAlign: "left",
  },
};