import { useState, useEffect } from "react";
import http from "../../api/http";

export default function CategoriesAdmin() {
  const [categories, setCategories] = useState([]);
  const [name, setName] = useState("");
  const [editId, setEditId] = useState(null);
  const [editName, setEditName] = useState("");
  const [error, setError] = useState("");

  const fetchCategories = async () => {
    const res = await http.get("/categories");
    setCategories(res.data || res || []);
  };

  useEffect(() => { fetchCategories(); }, []);

  const handleAdd = async () => {
    if (!name.trim()) return;
    try {
      await http.post("/categories", { name });
      setName("");
      fetchCategories();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleUpdate = async (id) => {
    try {
      await http.put(`/categories/${id}`, { name: editName });
      setEditId(null);
      fetchCategories();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this category?")) return;
    try {
      await http.delete(`/categories/${id}`);
      fetchCategories();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div style={styles.page}>
      <h2 style={styles.heading}>🗂 Categories</h2>

      {error && <div style={styles.error}>{error}</div>}

      {/* Add */}
      <div style={styles.addRow}>
        <input
          placeholder="New category name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          style={styles.input}
        />
        <button onClick={handleAdd} style={styles.addBtn}>+ Add</button>
      </div>

      {/* List */}
      <div style={styles.list}>
        {categories.map((cat) => (
          <div key={cat._id} style={styles.row}>
            {editId === cat._id ? (
              <>
                <input value={editName} onChange={(e) => setEditName(e.target.value)} style={{ ...styles.input, flex: 1 }} />
                <button onClick={() => handleUpdate(cat._id)} style={styles.saveBtn}>Save</button>
                <button onClick={() => setEditId(null)} style={styles.cancelBtn}>Cancel</button>
              </>
            ) : (
              <>
                <span style={styles.catName}>{cat.name}</span>
                <button onClick={() => { setEditId(cat._id); setEditName(cat.name); }} style={styles.editBtn}>Edit</button>
                <button onClick={() => handleDelete(cat._id)} style={styles.deleteBtn}>Delete</button>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

const styles = {
  page: { maxWidth: 500, margin: "0 auto" },
  heading: { fontSize: 22, fontWeight: "bold", marginBottom: 20 },
  error: { backgroundColor: "#fee2e2", color: "#dc2626", padding: "10px 14px", borderRadius: 8, marginBottom: 16 },
  addRow: { display: "flex", gap: 10, marginBottom: 20 },
  input: { padding: "9px 12px", border: "1px solid #d1d5db", borderRadius: 8, fontSize: 14, flex: 1 },
  addBtn: { padding: "9px 18px", backgroundColor: "#2563eb", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontSize: 14 },
  list: { display: "flex", flexDirection: "column", gap: 10 },
  row: { display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", backgroundColor: "#fff", borderRadius: 8, boxShadow: "0 1px 4px rgba(0,0,0,0.07)" },
  catName: { flex: 1, fontSize: 15 },
  editBtn: { padding: "6px 12px", backgroundColor: "#f59e0b", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer", fontSize: 13 },
  deleteBtn: { padding: "6px 12px", backgroundColor: "#ef4444", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer", fontSize: 13 },
  saveBtn: { padding: "6px 12px", backgroundColor: "#22c55e", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer", fontSize: 13 },
  cancelBtn: { padding: "6px 12px", backgroundColor: "#6b7280", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer", fontSize: 13 },
};