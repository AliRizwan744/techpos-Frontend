import { useState, useEffect, useRef } from "react";
import http from "../../api/http";

export default function ProductsAdmin() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ name: "", type: "product", price: "", stockQty: "", categoryId: "" });

  const [catSearch, setCatSearch] = useState("");
  const [showCatDropdown, setShowCatDropdown] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const [addingCat, setAddingCat] = useState(false);
  const catRef = useRef(null);

  const filteredCats = categories.filter((c) =>
    c.name.toLowerCase().includes(catSearch.toLowerCase())
  );

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

  const fetchCategories = async () => {
    const res = await http.get("/categories");
    setCategories(res.data || res || []);
  };

  useEffect(() => { fetchCategories(); }, []);
  useEffect(() => {
    const timer = setTimeout(fetchProducts, 400);
    return () => clearTimeout(timer);
  }, [search, categoryId]);

  useEffect(() => {
    const handler = (e) => {
      if (catRef.current && !catRef.current.contains(e.target)) {
        setShowCatDropdown(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

 const handleChange = (e) => {
  const { name, value, type } = e.target;
  setForm({
    ...form,
    [name]: type === "number" ? (value === "" ? "" : Number(value)) : value,
  });
};

  const handleAddCategory = async () => {
    if (!newCatName.trim()) return;
    try {
      setAddingCat(true);
      const res = await http.post("/categories", { name: newCatName });
      const newCat = res.data || res;
      await fetchCategories();
      setForm((prev) => ({ ...prev, categoryId: newCat._id || "" }));
      setCatSearch(newCatName);
      setNewCatName("");
      setShowCatDropdown(false);
    } catch (err) {
      alert(err.message);
    } finally {
      setAddingCat(false);
    }
  };

  const handleSubmit = async () => {
    if (!form.name || !form.price) { alert("Name aur price zaroor bharo"); return; }
    try {
      const body = {
        ...form,
        price: Number(form.price),
        stockQty: Number(form.stockQty) || 0,
      };
      if (editId) {
        await http.put(`/products/${editId}`, body);
      } else {
        await http.post("/products", body);
      }
      resetForm();
      fetchProducts();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleEdit = (p) => {
    setEditId(p._id);
    setForm({ name: p.name, type: p.type, price: p.price, stockQty: p.stockQty || 0, categoryId: p.categoryId?._id || "" });
    const cat = categories.find((c) => c._id === (p.categoryId?._id || p.categoryId));
    setCatSearch(cat?.name || "");
    setShowForm(true);
  };

  const handleToggle = async (id, isActive, stockQty, type) => {
    if (!isActive && type === "product" && Number(stockQty) === 0) {
      alert("Stock is 0");
      return;
    }
    try {
      await http.patch(`/products/${id}/toggle`);
      fetchProducts();
    } catch (err) {
      alert(err.message);
    }
  };

  const resetForm = () => {
    setShowForm(false); setEditId(null);
    setForm({ name: "", type: "product", price: "", stockQty: "", categoryId: "" });
    setCatSearch(""); setNewCatName("");
  };

  const selectedCatName = categories.find((c) => c._id === form.categoryId)?.name;

  return (
    <div style={styles.page}>
      <div style={styles.topRow}>
        <h2 style={styles.heading}>📦 Products</h2>
        <button onClick={() => { resetForm(); setShowForm(true); }} style={styles.addBtn}>
          + Add Product
        </button>
      </div>

      {error && <div style={styles.error}>{error}</div>}

      <div style={styles.filterRow}>
        <input placeholder="🔍 Search products..." value={search} onChange={(e) => setSearch(e.target.value)} style={styles.input} />
        <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} style={styles.select}>
          <option value="">All Categories</option>
          {categories.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
        </select>
      </div>

      {showForm && (
        <div style={styles.formBox}>
          <h3 style={styles.formTitle}>{editId ? "✏️ Edit Product" : "➕ Add Product"}</h3>
          <div style={styles.formGrid}>

            <div style={styles.formField}>
              <label style={styles.formLabel}>Product Name *</label>
              <input name="name" placeholder="e.g. Keyboard" value={form.name} onChange={handleChange} style={styles.formInput} />
            </div>

            <div style={styles.formField}>
              <label style={styles.formLabel}>Type *</label>
              <select name="type" value={form.type} onChange={handleChange} style={styles.formInput}>
                <option value="product">Product (has stock)</option>
                <option value="service">Service (no stock)</option>
              </select>
            </div>

            <div style={styles.formField}>
              <label style={styles.formLabel}>Price (Rs) *</label>
              <input name="price" type="number" placeholder="0" value={form.price} onChange={handleChange} style={styles.formInput} />
            </div>

            {form.type === "product" && (
              <div style={styles.formField}>
                <label style={styles.formLabel}>Stock Qty</label>
                <input name="stockQty" type="number" placeholder="0" value={form.stockQty} onChange={handleChange} style={styles.formInput} />
              </div>
            )}

            <div style={{ ...styles.formField, gridColumn: "1 / -1" }} ref={catRef}>
              <label style={styles.formLabel}>Category</label>
              <div style={styles.catInputWrapper}>
                <input
                  placeholder="🔍 Search or select category..."
                  value={catSearch}
                  onChange={(e) => { setCatSearch(e.target.value); setShowCatDropdown(true); setForm((p) => ({ ...p, categoryId: "" })); }}
                  onFocus={() => setShowCatDropdown(true)}
                  style={styles.formInput}
                />
                {form.categoryId && (
                  <span style={styles.selectedCatBadge}>✅ {selectedCatName}</span>
                )}
                {showCatDropdown && (
                  <div style={styles.catDropdown}>
                    {filteredCats.length > 0 ? (
                      filteredCats.map((c) => (
                        <div
                          key={c._id}
                          onClick={() => { setForm((p) => ({ ...p, categoryId: c._id })); setCatSearch(c.name); setShowCatDropdown(false); }}
                          style={{ ...styles.catOption, backgroundColor: form.categoryId === c._id ? "rgba(37,99,235,0.2)" : "transparent" }}
                        >
                          {c.name}
                        </div>
                      ))
                    ) : (
                      <div style={styles.catNoResult}>No category found</div>
                    )}
                    <div style={styles.catAddSection}>
                      <input
                        placeholder="+ Add new category..."
                        value={newCatName}
                        onChange={(e) => setNewCatName(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleAddCategory()}
                        style={styles.catAddInput}
                      />
                      <button onClick={handleAddCategory} disabled={addingCat || !newCatName.trim()} style={styles.catAddBtn}>
                        {addingCat ? "..." : "Add"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div style={styles.activeInfo}>
            ✅ Stock {form.stockQty > 0 ? `${form.stockQty} — product Active hoga` : "0 — product Inactive rahega (stock add karo)"}
          </div>

          <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
            <button onClick={handleSubmit} style={styles.addBtn}>{editId ? "Update Product" : "Save Product"}</button>
            <button onClick={resetForm} style={styles.cancelBtn}>Cancel</button>
          </div>
        </div>
      )}

      {loading ? <p style={{ color: "#94a3b8" }}>Loading...</p> : (
        <div style={styles.tableWrapper}>
          <table style={styles.table}>
            <thead>
              <tr>
                {["Name", "Type", "Price", "Stock", "Category", "Status", "Actions"].map((h) => (
                  <th key={h} style={styles.th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {products.length === 0 ? (
                <tr><td colSpan={7} style={{ textAlign: "center", padding: 30, color: "#64748b" }}>No products found</td></tr>
              ) : (
                products.map((p) => (
                  <tr key={p._id} style={styles.tableRow}>
                    <td style={styles.td}><strong style={{ color: "#f1f5f9" }}>{p.name}</strong></td>
                    <td style={styles.td}>
                      <span style={{ ...styles.typeBadge, backgroundColor: p.type === "product" ? "rgba(59,130,246,0.15)" : "rgba(167,139,250,0.15)", color: p.type === "product" ? "#60a5fa" : "#a78bfa" }}>
                        {p.type}
                      </span>
                    </td>
                    <td style={{ ...styles.td, color: "#60a5fa", fontWeight: "700" }}>Rs {p.price?.toLocaleString()}</td>
                    <td style={{ ...styles.td, color: p.type === "product" && p.stockQty < 5 ? "#f59e0b" : "#94a3b8", fontWeight: "600" }}>
                      {p.type === "product" ? p.stockQty : "—"}
                    </td>
                    <td style={styles.td}>{p.categoryId?.name || "—"}</td>
                    <td style={styles.td}>
                      <button
                        onClick={() => handleToggle(p._id, p.isActive, p.stockQty, p.type)}
                        style={{
                          ...styles.statusBtn,
                          backgroundColor: p.isActive ? "rgba(34,197,94,0.15)" : "rgba(239,68,68,0.15)",
                          color: p.isActive ? "#4ade80" : "#f87171",
                          borderColor: p.isActive ? "rgba(34,197,94,0.3)" : "rgba(239,68,68,0.3)",
                        }}
                      >
                        {p.isActive ? "✅ Active" : "❌ Inactive"}
                      </button>
                    </td>
                    <td style={styles.td}>
                      <button onClick={() => handleEdit(p)} style={styles.editBtn}>Edit</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

const styles = {
  page: { maxWidth: 960, margin: "0 auto" },
  topRow: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  heading: { fontSize: 22, fontWeight: "bold", color: "#f1f5f9" },
  filterRow: { display: "flex", gap: 10, marginBottom: 16 },
  input: { padding: "9px 12px", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, fontSize: 14, backgroundColor: "rgba(255,255,255,0.05)", color: "#f1f5f9", flex: 1, outline: "none" },
  select: { padding: "9px 12px", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, fontSize: 14, backgroundColor: "rgba(15,23,42,0.8)", color: "#94a3b8", outline: "none" },
  formBox: { backgroundColor: "rgba(30,41,59,0.8)", border: "1px solid rgba(255,255,255,0.08)", padding: 24, borderRadius: 14, marginBottom: 24 },
  formTitle: { fontSize: 16, fontWeight: "bold", color: "#f1f5f9", marginBottom: 16 },
  formGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 },
  formField: { display: "flex", flexDirection: "column", gap: 6 },
  formLabel: { fontSize: 12, color: "#94a3b8", fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.5 },
  formInput: { padding: "9px 12px", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 8, fontSize: 14, backgroundColor: "rgba(255,255,255,0.05)", color: "#f1f5f9", outline: "none", width: "100%", boxSizing: "border-box" },
  catInputWrapper: { position: "relative" },
  selectedCatBadge: { fontSize: 11, color: "#4ade80", marginTop: 4, display: "block" },
  catDropdown: { position: "absolute", top: "100%", left: 0, right: 0, zIndex: 99, backgroundColor: "#1e293b", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 10, marginTop: 4, maxHeight: 200, overflowY: "auto", boxShadow: "0 8px 24px rgba(0,0,0,0.4)" },
  catOption: { padding: "10px 14px", cursor: "pointer", color: "#e2e8f0", fontSize: 14, borderBottom: "1px solid rgba(255,255,255,0.04)" },
  catNoResult: { padding: "10px 14px", color: "#64748b", fontSize: 13, textAlign: "center" },
  catAddSection: { display: "flex", gap: 8, padding: "8px 10px", borderTop: "1px solid rgba(255,255,255,0.08)", backgroundColor: "rgba(37,99,235,0.08)" },
  catAddInput: { flex: 1, padding: "6px 10px", borderRadius: 6, border: "1px solid rgba(255,255,255,0.1)", backgroundColor: "rgba(255,255,255,0.05)", color: "#f1f5f9", fontSize: 13, outline: "none" },
  catAddBtn: { padding: "6px 14px", backgroundColor: "#2563eb", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer", fontSize: 12, fontWeight: "700" },
  activeInfo: { fontSize: 12, color: "#94a3b8", backgroundColor: "rgba(255,255,255,0.04)", padding: "8px 12px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.08)", marginTop: 8 },
  tableWrapper: { borderRadius: 12, overflow: "hidden", border: "1px solid rgba(255,255,255,0.06)" },
  table: { width: "100%", borderCollapse: "collapse" },
  tableRow: { borderBottom: "1px solid rgba(255,255,255,0.04)" },
  th: { textAlign: "left", padding: "12px 14px", backgroundColor: "rgba(255,255,255,0.04)", fontSize: 11, color: "#64748b", fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.5 },
  td: { padding: "12px 14px", fontSize: 14, color: "#cbd5e1" },
  typeBadge: { padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: "700" },
  statusBtn: { padding: "5px 12px", border: "1px solid", borderRadius: 20, cursor: "pointer", fontSize: 12, fontWeight: "700", background: "transparent" },
  addBtn: { padding: "10px 20px", backgroundColor: "#2563eb", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontSize: 14, fontWeight: "600" },
  cancelBtn: { padding: "10px 20px", backgroundColor: "rgba(255,255,255,0.06)", color: "#94a3b8", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, cursor: "pointer", fontSize: 14 },
  editBtn: { padding: "5px 14px", backgroundColor: "rgba(245,158,11,0.15)", color: "#fbbf24", border: "1px solid rgba(245,158,11,0.3)", borderRadius: 6, cursor: "pointer", fontSize: 13, fontWeight: "600" },
  error: { backgroundColor: "rgba(239,68,68,0.1)", color: "#f87171", padding: "10px 14px", borderRadius: 8, marginBottom: 16, border: "1px solid rgba(239,68,68,0.2)" },
};