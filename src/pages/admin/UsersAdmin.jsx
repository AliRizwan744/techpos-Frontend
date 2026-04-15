import { useState, useEffect } from "react";
import http from "../../api/http";
import Loading from "../../components/common/Loading";
import ErrorBox from "../../components/common/ErrorBox";

export default function UsersAdmin() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "", email: "", password: "", role: "cashier",
  });

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await http.get("/users");
      setUsers(res.data || res || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleCreate = async () => {
    if (!form.name || !form.email || !form.password) return;
    try {
      setSaving(true);
      await http.post("/users", form);
      setShowModal(false);
      setForm({ name: "", email: "", password: "", role: "cashier" });
      fetchUsers();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (id) => {
    try {
      await http.patch(`/users/${id}/toggle`);
      fetchUsers();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleRoleChange = async (id, role) => {
    try {
      await http.patch(`/users/${id}/role`, { role });
      fetchUsers();
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) return <Loading message="Loading users..." />;

  return (
    <div style={styles.page}>
      <div style={styles.topBar}>
        <h2 style={styles.heading}>👥 Users</h2>
        <button onClick={() => setShowModal(true)} style={styles.addBtn}>
          + Add User
        </button>
      </div>

      <ErrorBox message={error} onRetry={fetchUsers} />

      <div style={styles.tableWrapper}>
        <table style={styles.table}>
          <thead>
            <tr style={styles.tableHead}>
              <th style={styles.th}>Name</th>
              <th style={styles.th}>Email</th>
              <th style={styles.th}>Role</th>
              <th style={styles.th}>Status</th>
              <th style={styles.th}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr><td colSpan={5} style={styles.empty}>No users found.</td></tr>
            ) : (
              users.map((u) => (
                <tr key={u._id} style={styles.tableRow}>
                  <td style={{ ...styles.td, fontWeight: "bold" }}>{u.name}</td>
                  <td style={styles.td}>{u.email}</td>
                  <td style={styles.td}>
                    <select
                      value={u.role}
                      onChange={(e) => handleRoleChange(u._id, e.target.value)}
                      style={styles.roleSelect}
                    >
                      <option value="admin">Admin</option>
                      <option value="cashier">Cashier</option>
                    </select>
                  </td>
                  <td style={styles.td}>
                    <span style={{
                      ...styles.statusBadge,
                      backgroundColor: u.isActive ? "#e8f5e9" : "#fafafa",
                      color: u.isActive ? "#27ae60" : "#aaa",
                    }}>
                      {u.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td style={styles.td}>
                    <button
                      onClick={() => handleToggle(u._id)}
                      style={{
                        ...styles.toggleBtn,
                        backgroundColor: u.isActive ? "#fff3f3" : "#e8f5e9",
                        color: u.isActive ? "#e74c3c" : "#27ae60",
                        borderColor: u.isActive ? "#f5c6c6" : "#b2dfdb",
                      }}
                    >
                      {u.isActive ? "Deactivate" : "Activate"}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div style={styles.overlay}>
          <div style={styles.modal}>
            <h3 style={styles.modalTitle}>➕ Add New User</h3>
            <div style={styles.fields}>
              <div style={styles.field}>
                <label style={styles.label}>Full Name *</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                  style={styles.input}
                  placeholder="Ali Ahmed"
                />
              </div>
              <div style={styles.field}>
                <label style={styles.label}>Email *</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                  style={styles.input}
                  placeholder="ali@example.com"
                />
              </div>
              <div style={styles.field}>
                <label style={styles.label}>Password *</label>
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
                  style={styles.input}
                  placeholder="Min 6 characters"
                />
              </div>
              <div style={styles.field}>
                <label style={styles.label}>Role</label>
                <select
                  value={form.role}
                  onChange={(e) => setForm((p) => ({ ...p, role: e.target.value }))}
                  style={styles.input}
                >
                  <option value="cashier">Cashier</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </div>
            <div style={styles.modalBtns}>
              <button onClick={() => setShowModal(false)} style={styles.cancelBtn}>Cancel</button>
              <button onClick={handleCreate} disabled={saving} style={styles.saveBtn}>
                {saving ? "Creating..." : "✅ Create User"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  page: { maxWidth: 900, margin: "0 auto" },
  topBar: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  heading: { fontSize: 22, fontWeight: "bold", color: "#222" },
  addBtn: { padding: "10px 20px", backgroundColor: "#27ae60", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontSize: 14, fontWeight: "bold" },
  tableWrapper: { backgroundColor: "#fff", borderRadius: 12, boxShadow: "0 2px 8px rgba(0,0,0,0.08)", overflow: "hidden" },
  table: { width: "100%", borderCollapse: "collapse" },
  tableHead: { backgroundColor: "#f8f9fa" },
  tableRow: { borderBottom: "1px solid #f5f5f5" },
  th: { padding: "12px 16px", fontSize: 12, color: "#888", fontWeight: "bold", textTransform: "uppercase", textAlign: "left" },
  td: { padding: "13px 16px", fontSize: 14, color: "#444" },
  roleSelect: { padding: "5px 10px", borderRadius: 7, border: "1px solid #ddd", fontSize: 13, backgroundColor: "#f8f9fa" },
  statusBadge: { padding: "3px 12px", borderRadius: 20, fontSize: 11, fontWeight: "bold" },
  toggleBtn: { padding: "6px 14px", border: "1px solid", borderRadius: 7, cursor: "pointer", fontSize: 12, fontWeight: "bold" },
  empty: { padding: 40, textAlign: "center", color: "#aaa" },
  overlay: { position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 999 },
  modal: { backgroundColor: "#fff", borderRadius: 14, padding: 28, width: 420, boxShadow: "0 8px 32px rgba(0,0,0,0.2)" },
  modalTitle: { fontSize: 18, fontWeight: "bold", marginBottom: 20 },
  fields: { display: "flex", flexDirection: "column", gap: 14 },
  field: { display: "flex", flexDirection: "column", gap: 5 },
  label: { fontSize: 13, color: "#555", fontWeight: "bold" },
  input: { padding: "10px 12px", borderRadius: 8, border: "1px solid #ddd", fontSize: 14 },
  modalBtns: { display: "flex", gap: 10, marginTop: 22 },
  cancelBtn: { flex: 1, padding: "11px 0", backgroundColor: "#f5f5f5", color: "#555", border: "1px solid #ddd", borderRadius: 9, cursor: "pointer", fontSize: 14 },
  saveBtn: { flex: 2, padding: "11px 0", backgroundColor: "#1976d2", color: "#fff", border: "none", borderRadius: 9, cursor: "pointer", fontSize: 14, fontWeight: "bold" },
};