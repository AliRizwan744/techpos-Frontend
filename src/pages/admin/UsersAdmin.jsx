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

  // NEW STATES
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "cashier",
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
    if (!window.confirm("Are you sure?")) return;
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

  // FILTER LOGIC
  const filteredUsers = users.filter((u) => {
    const matchSearch =
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase());

    const matchRole = roleFilter === "all" || u.role === roleFilter;
    const matchStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && u.isActive) ||
      (statusFilter === "inactive" && !u.isActive);

    return matchSearch && matchRole && matchStatus;
  });

  if (loading) return <Loading message="Loading users..." />;

  return (
    <div style={styles.page}>
      {/* TOP BAR */}
      <div style={styles.topBar}>
        <h2 style={styles.heading}>👥 Users Management</h2>
        <button onClick={() => setShowModal(true)} style={styles.addBtn}>
          + Add User
        </button>
      </div>

      <ErrorBox message={error} onRetry={fetchUsers} />

      {/* STATS */}
      <div style={styles.statsGrid}>
        <StatCard title="Total Users" value={users.length} />
        <StatCard title="Admins" value={users.filter(u=>u.role==="admin").length} />
        <StatCard title="Active" value={users.filter(u=>u.isActive).length} />
        <StatCard title="Inactive" value={users.filter(u=>!u.isActive).length} />
      </div>

      {/* SEARCH + FILTERS */}
      <div style={styles.filters}>
        <input
          placeholder="🔍 Search users..."
          value={search}
          onChange={(e)=>setSearch(e.target.value)}
          style={styles.search}
        />

        <select value={roleFilter} onChange={e=>setRoleFilter(e.target.value)} style={styles.filterSelect}>
          <option value="all">All Roles</option>
          <option value="admin">Admin</option>
          <option value="cashier">Cashier</option>
        </select>

        <select value={statusFilter} onChange={e=>setStatusFilter(e.target.value)} style={styles.filterSelect}>
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      {/* TABLE */}
      <div style={styles.tableWrapper}>
        <table style={styles.table}>
          <thead>
            <tr style={styles.tableHead}>
              <th style={styles.th}>User</th>
              <th style={styles.th}>Role</th>
              <th style={styles.th}>Status</th>
              <th style={styles.th}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={4}>
                  <div style={styles.emptyBox}>
                    👤 No users found
                    <p>Create your first team member</p>
                  </div>
                </td>
              </tr>
            ) : (
              filteredUsers.map((u) => (
                <tr key={u._id} style={styles.tableRow}>
                  <td style={styles.td}>
                    <div style={styles.userCell}>
                      <div style={styles.avatar}>{u.name.charAt(0).toUpperCase()}</div>
                      <div>
                        <div style={styles.userName}>{u.name}</div>
                        <div style={styles.userEmail}>{u.email}</div>
                      </div>
                    </div>
                  </td>

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
                      backgroundColor: u.isActive ? "#e8f5e9" : "#f5f5f5",
                      color: u.isActive ? "#27ae60" : "#999",
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

      {/* MODAL */}
      {showModal && (
        <div style={styles.overlay}>
          <div style={styles.modal}>
            <h3>Add New User</h3>

            <input placeholder="Full Name"
              value={form.name}
              onChange={(e)=>setForm(p=>({...p,name:e.target.value}))}
              style={styles.input}
            />
            <input placeholder="Email"
              value={form.email}
              onChange={(e)=>setForm(p=>({...p,email:e.target.value}))}
              style={styles.input}
            />
            <input type="password" placeholder="Password"
              value={form.password}
              onChange={(e)=>setForm(p=>({...p,password:e.target.value}))}
              style={styles.input}
            />

            <select value={form.role}
              onChange={(e)=>setForm(p=>({...p,role:e.target.value}))}
              style={styles.input}
            >
              <option value="cashier">Cashier</option>
              <option value="admin">Admin</option>
            </select>

            <div style={{display:"flex",gap:10}}>
              <button onClick={()=>setShowModal(false)} style={styles.cancelBtn}>Cancel</button>
              <button onClick={handleCreate} disabled={saving} style={styles.saveBtn}>
                {saving ? "Creating..." : "Create User"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({title,value}) {
  return (
    <div style={styles.statCard}>
      <div style={styles.statValue}>{value}</div>
      <div style={styles.statTitle}>{title}</div>
    </div>
  );
}

const styles = {
  page:{maxWidth:1100,margin:"0 auto"},
  topBar:{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20},
  heading:{fontSize:24,fontWeight:"bold"},
  addBtn:{padding:"10px 18px",background:"#27ae60",color:"#fff",border:"none",borderRadius:8,cursor:"pointer"},

  statsGrid:{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:16,marginBottom:20},
  statCard:{background:"#fff",padding:18,borderRadius:12,boxShadow:"0 2px 8px rgba(0,0,0,0.08)"},
  statValue:{fontSize:24,fontWeight:"bold"},
  statTitle:{color:"#777",fontSize:13},

  filters:{display:"flex",gap:10,marginBottom:15},
  search:{flex:1,padding:10,borderRadius:8,border:"1px solid #ddd"},
  filterSelect:{padding:"10px 12px",borderRadius:8,border:"1px solid #ddd"},

  tableWrapper:{background:"#fff",borderRadius:12,boxShadow:"0 2px 8px rgba(0,0,0,0.08)"},
  table:{width:"100%",borderCollapse:"collapse"},
  tableHead:{background:"#f8f9fa"},
  th:{padding:14,textAlign:"left",fontSize:12,color:"#888"},
  td:{padding:14},

  userCell:{display:"flex",alignItems:"center",gap:10},
  avatar:{width:36,height:36,borderRadius:"50%",background:"#1976d2",color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:"bold"},
  userName:{fontWeight:"bold"},
  userEmail:{fontSize:12,color:"#888"},

  statusBadge:{padding:"4px 12px",borderRadius:20,fontSize:12,fontWeight:"bold"},
  roleSelect:{padding:6,borderRadius:6},
  toggleBtn:{padding:"6px 12px",border:"none",borderRadius:6,cursor:"pointer",fontWeight:"bold"},

  emptyBox:{padding:40,textAlign:"center",color:"#777"},

  overlay:{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",display:"flex",alignItems:"center",justifyContent:"center"},
  modal:{background:"#fff",padding:25,borderRadius:12,width:350,display:"flex",flexDirection:"column",gap:10},
  input:{padding:10,borderRadius:8,border:"1px solid #ddd"},
  cancelBtn:{flex:1,padding:10},
  saveBtn:{flex:1,padding:10,background:"#1976d2",color:"#fff",border:"none",borderRadius:8}
};