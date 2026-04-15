import { useState, useEffect } from "react";
import http from "../../api/http";

export default function ProductsAdmin() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ name: "", type: "product", price: "", stockQty: "", categoryId: "" });

  const fetchProducts = async () => {
    try {
      setLoading(true);
      let url = "/products?";
      if (search) url += `q=${search}&`;
      if (categoryId) url += `categoryId=${categoryId}&`;
      const res = await http.get(url);
      setProducts(res.data || res || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchCategories = async () => {
      const res = await http.get("/categories");
      setCategories(res.data || res || []);
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    const timer = setTimeout(fetchProducts, 400);
    return () => clearTimeout(timer);
  }, [search, categoryId]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async () => {
    try {
      const body = { ...form, price: Number(form.price), stockQty: Number(form.stockQty) };
      if (editId) {
        await http.put(`/products/${editId}`, body);
      } else {
        await http.post("/products", body);
      }
      setShowForm(false);
      setEditId(null);
      setForm({ name: "", type: "product", price: "", stockQty: "", categoryId: "" });
      fetchProducts();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleEdit = (p) => {
    setEditId(p._id);
    setForm({ name: p.name, type: p.type, price: p.price, stockQty: p.stockQty || 0, categoryId: p.categoryId?._id || "" });
    setShowForm(true);
  };

  const handleToggle = async (id) => {
    await http.patch(`/products/${id}/toggle`);
    fetchProducts();
  };

  return (
    <div style={styles.page}>
      <div style={styles.topRow}>
        <h2 style={styles.heading}>📦 Products</h2>
        <button onClick={() => { setShowForm(true); setEditId(null); setForm({ name: "", type: "product", price: "", stockQty: "", categoryId: "" }); }} style={styles.addBtn}>
          + Add Product
        </button>
      </div>

      {error && <div style={styles.error}>{error}</div>}

      {/* Filters */}
      <div style={styles.filterRow}>
        <input placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} style={styles.input} />
        <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} style={styles.select}>
          <option value="">All Categories</option>
          {categories.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
        </select>
      </div>

      {/* Form */}
      {showForm && (
        <div style={styles.formBox}>
          <h3 style={{ marginBottom: 12 }}>{editId ? "Edit Product" : "Add Product"}</h3>
          <input name="name" placeholder="Product Name" value={form.name} onChange={handleChange} style={styles.input} />
          <select name="type" value={form.type} onChange={handleChange} style={styles.select}>
            <option value="product">Product (has stock)</option>
            <option value="service">Service (no stock)</option>
          </select>
          <input name="price" type="number" placeholder="Price" value={form.price} onChange={handleChange} style={styles.input} />
          {form.type === "product" && (
            <input name="stockQty" type="number" placeholder="Stock Qty" value={form.stockQty} onChange={handleChange} style={styles.input} />
          )}
          <select name="categoryId" value={form.categoryId} onChange={handleChange} style={styles.select}>
            <option value="">Select Category</option>
            {categories.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
          </select>
          <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
            <button onClick={handleSubmit} style={styles.addBtn}>{editId ? "Update" : "Save"}</button>
            <button onClick={() => setShowForm(false)} style={styles.cancelBtn}>Cancel</button>
          </div>
        </div>
      )}

      {/* Table */}
      {loading ? <p>Loading...</p> : (
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Name</th>
              <th style={styles.th}>Type</th>
              <th style={styles.th}>Price</th>
              <th style={styles.th}>Stock</th>
              <th style={styles.th}>Category</th>
              <th style={styles.th}>Status</th>
              <th style={styles.th}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p._id}>
                <td style={styles.td}>{p.name}</td>
                <td style={styles.td}>{p.type}</td>
                <td style={styles.td}>Rs {p.price}</td>
                <td style={styles.td}>{p.type === "product" ? p.stockQty : "—"}</td>
                <td style={styles.td}>{p.categoryId?.name || "—"}</td>
                <td style={styles.td}>
                  <span style={{ color: p.active ? "#27ae60" : "#e74c3c" }}>
                    {p.active ? "Active" : "Inactive"}
                  </span>
                </td>
                <td style={styles.td}>
                  <button onClick={() => handleEdit(p)} style={styles.editBtn}>Edit</button>
                  <button onClick={() => handleToggle(p._id)} style={styles.toggleBtn}>
                    {p.active ? "Deactivate" : "Activate"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

const styles = {
  page: { maxWidth: 900, margin: "0 auto" },
  topRow: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  heading: { fontSize: 22, fontWeight: "bold" },
  filterRow: { display: "flex", gap: 10, marginBottom: 16 },
  formBox: { backgroundColor: "#f9fafb", padding: 20, borderRadius: 10, marginBottom: 20, display: "flex", flexDirection: "column", gap: 10 },
  input: { padding: "9px 12px", border: "1px solid #d1d5db", borderRadius: 8, fontSize: 14, width: "100%", boxSizing: "border-box" },
  select: { padding: "9px 12px", border: "1px solid #d1d5db", borderRadius: 8, fontSize: 14 },
  table: { width: "100%", borderCollapse: "collapse" },
  th: { textAlign: "left", padding: "10px 12px", backgroundColor: "#f3f4f6", fontSize: 13, color: "#555" },
  td: { padding: "10px 12px", borderBottom: "1px solid #f0f0f0", fontSize: 14 },
  addBtn: { padding: "8px 16px", backgroundColor: "#2563eb", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontSize: 14 },
  cancelBtn: { padding: "8px 16px", backgroundColor: "#f3f4f6", color: "#555", border: "none", borderRadius: 8, cursor: "pointer", fontSize: 14 },
  editBtn: { padding: "5px 10px", backgroundColor: "#f59e0b", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer", marginRight: 6, fontSize: 13 },
  toggleBtn: { padding: "5px 10px", backgroundColor: "#6b7280", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer", fontSize: 13 },
  error: { backgroundColor: "#fee2e2", color: "#dc2626", padding: "10px 14px", borderRadius: 8, marginBottom: 16 },
};