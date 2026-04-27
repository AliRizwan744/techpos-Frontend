import { useState, useEffect } from "react";
import http from "../../api/http";

export default function CategoriesAdmin() {
  const [categories, setCategories] = useState([]);
  const [name, setName] = useState("");
  const [editId, setEditId] = useState(null);
  const [editName, setEditName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const res = await http.get("/categories");
      setCategories(res.data || res || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCategories(); }, []);

  const handleAdd = async () => {
  if (!name.trim()) {
    setError("Category name required hai!");
    return;
  }
  try {
    await http.post("/categories", { name });
    setName("");
    setError(""); // ✅ error clear karo
    fetchCategories();
  } catch (err) {
    setError(err.message);
  }
};
  const handleUpdate = async (id) => {
    if (!editName.trim()) return;
    try {
      await http.put(`/categories/${id}`, { name: editName });
      setEditId(null);
      fetchCategories();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Is category ko delete karna chahte ho?")) return;
    try {
      setDeletingId(id);
      await http.delete(`/categories/${id}`);
      fetchCategories();
    } catch (err) {
      setError(err.message);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div style={styles.page}>
      {/* Header */}
      <div style={styles.header}>
        <div>
          <h2 style={styles.heading}>🗂 Categories</h2>
          <p style={styles.subheading}>{categories.length} categories total</p>
        </div>
      </div>

      {error && (
        <div style={styles.error}>
          ⚠️ {error}
          <button onClick={() => setError("")} style={styles.errorClose}>✕</button>
        </div>
      )}

      {/* Add new */}
      <div style={styles.addCard}>
        <h3 style={styles.addTitle}>➕ Add New Category</h3>
        <div style={styles.addRow}>
          <input
            placeholder="Category name e.g. Electronics..."
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            style={styles.input}
          />
          <button
            onClick={handleAdd}
            disabled={!name.trim()}
            style={{ ...styles.addBtn, opacity: !name.trim() ? 0.5 : 1 }}
          >
            + Add
          </button>
        </div>
        <p style={styles.hint}>Press Enter to add quickly</p>
      </div>

      {/* List */}
      {loading ? (
        <p style={styles.loadingText}>Loading...</p>
      ) : categories.length === 0 ? (
        <div style={styles.emptyBox}>
          <p style={styles.emptyIcon}>🗂</p>
          <p style={styles.emptyText}>No categories yet — add one above</p>
        </div>
      ) : (
        <div style={styles.list}>
          {categories.map((cat, index) => (
            <div key={cat._id} style={styles.row}>
              {/* Index number */}
              <div style={styles.indexBadge}>{index + 1}</div>

              {editId === cat._id ? (
                <>
                 <input
  placeholder="Category name e.g. Electronics..."
  value={name}
  onChange={(e) => { setName(e.target.value); if (error) setError(""); }}
  onKeyDown={(e) => e.key === "Enter" && handleAdd()}
  style={{
    ...styles.input,
    borderColor: !name.trim() && error ? "rgba(239,68,68,0.5)" : "rgba(255,255,255,0.12)",
  }}
/>
                  <button onClick={() => handleUpdate(cat._id)} style={styles.saveBtn}>✓ Save</button>
                  <button onClick={() => setEditId(null)} style={styles.cancelBtn}>✕</button>
                </>
              ) : (
                <>
                  <span style={styles.catName}>{cat.name}</span>
                  <div style={styles.actions}>
                    <button
                      onClick={() => { setEditId(cat._id); setEditName(cat.name); }}
                      style={styles.editBtn}
                    >
                      ✏️ Edit
                    </button>
                    <button
                      onClick={() => handleDelete(cat._id)}
                      disabled={deletingId === cat._id}
                      style={styles.deleteBtn}
                    >
                      {deletingId === cat._id ? "..." : "🗑 Delete"}
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const styles = {
  page: { maxWidth: 600, margin: "0 auto" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 },
  heading: { fontSize: 24, fontWeight: "bold", color: "#f1f5f9", margin: 0 },
  subheading: { fontSize: 13, color: "#4a5568", margin: "4px 0 0" },

  error: {
    backgroundColor: "rgba(239,68,68,0.1)", color: "#f87171",
    padding: "12px 16px", borderRadius: 10, marginBottom: 16,
    border: "1px solid rgba(239,68,68,0.2)",
    display: "flex", justifyContent: "space-between", alignItems: "center",
  },
  errorClose: { background: "none", border: "none", color: "#f87171", cursor: "pointer", fontSize: 16 },

  addCard: {
    backgroundColor: "rgba(30,41,59,0.8)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 14, padding: 20, marginBottom: 24,
  },
  addTitle: { fontSize: 14, fontWeight: "700", color: "#94a3b8", margin: "0 0 12px", textTransform: "uppercase", letterSpacing: 0.5 },
  addRow: { display: "flex", gap: 10 },
  input: {
    flex: 1, padding: "10px 14px",
    border: "1px solid rgba(255,255,255,0.12)",
    borderRadius: 10, fontSize: 14,
    backgroundColor: "rgba(255,255,255,0.05)",
    color: "#f1f5f9", outline: "none",
  },
  addBtn: {
    padding: "10px 20px", backgroundColor: "#2563eb",
    color: "#fff", border: "none", borderRadius: 10,
    cursor: "pointer", fontSize: 14, fontWeight: "700",
    whiteSpace: "nowrap",
  },
  hint: { fontSize: 11, color: "#2d3748", margin: "8px 0 0" },

  loadingText: { color: "#4a5568", textAlign: "center", padding: 20 },
  emptyBox: { textAlign: "center", padding: 40 },
  emptyIcon: { fontSize: 40, marginBottom: 8 },
  emptyText: { color: "#4a5568", fontSize: 14 },

  list: { display: "flex", flexDirection: "column", gap: 8 },
  row: {
    display: "flex", alignItems: "center", gap: 12,
    padding: "14px 16px",
    backgroundColor: "rgba(30,41,59,0.6)",
    border: "1px solid rgba(255,255,255,0.06)",
    borderRadius: 12,
    transition: "all 0.15s",
  },
  indexBadge: {
    width: 28, height: 28, borderRadius: "50%",
    backgroundColor: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.08)",
    color: "#4a5568", fontSize: 12, fontWeight: "700",
    display: "flex", alignItems: "center", justifyContent: "center",
    flexShrink: 0,
  },
  catName: { flex: 1, fontSize: 15, color: "#e2e8f0", fontWeight: "500" },
  editInput: {
    flex: 1, padding: "8px 12px",
    border: "1px solid rgba(37,99,235,0.5)",
    borderRadius: 8, fontSize: 14,
    backgroundColor: "rgba(37,99,235,0.1)",
    color: "#f1f5f9", outline: "none",
  },
  actions: { display: "flex", gap: 8 },
  editBtn: {
    padding: "6px 14px",
    backgroundColor: "rgba(245,158,11,0.15)",
    color: "#fbbf24",
    border: "1px solid rgba(245,158,11,0.3)",
    borderRadius: 8, cursor: "pointer", fontSize: 12, fontWeight: "700",
  },
  deleteBtn: {
    padding: "6px 14px",
    backgroundColor: "rgba(239,68,68,0.15)",
    color: "#f87171",
    border: "1px solid rgba(239,68,68,0.3)",
    borderRadius: 8, cursor: "pointer", fontSize: 12, fontWeight: "700",
  },
  saveBtn: {
    padding: "6px 14px",
    backgroundColor: "rgba(34,197,94,0.15)",
    color: "#4ade80",
    border: "1px solid rgba(34,197,94,0.3)",
    borderRadius: 8, cursor: "pointer", fontSize: 12, fontWeight: "700",
  },
  cancelBtn: {
    padding: "6px 14px",
    backgroundColor: "rgba(100,116,139,0.15)",
    color: "#94a3b8",
    border: "1px solid rgba(100,116,139,0.3)",
    borderRadius: 8, cursor: "pointer", fontSize: 12, fontWeight: "700",
  },
};