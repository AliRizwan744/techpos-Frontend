import { useState, useEffect } from "react";
import http from "../../api/http";
import Loading from "../common/Loading";
import ErrorBox from "../common/ErrorBox";

export default function ProductList({ onAdd, animatingId, cartItems = [] }) {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [hoveredId, setHoveredId] = useState(null);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await http.get("/categories");
        setCategories(res.data || res || []);
      } catch { }
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true); setError("");
        let url = "/products?active=true";
        if (search) url += `&q=${search}`;
        if (categoryId) url += `&categoryId=${categoryId}`;
        const res = await http.get(url);
        setProducts(res.data || res || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    const timer = setTimeout(fetchProducts, 300);
    return () => clearTimeout(timer);
  }, [search, categoryId]);

  return (
    <div style={styles.wrapper}>
      {/* Header */}
      <div style={styles.headerRow}>
        <h2 style={styles.heading}>Products</h2>
        <span style={styles.count}>{products.length} items</span>
      </div>

      {/* Search + Filter */}
      <div style={styles.filterRow}>
        <div style={styles.searchWrapper}>
          <span style={styles.searchIcon}>🔍</span>
          <input
            placeholder="Search by name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={styles.searchInput}
          />
          {search && <button onClick={() => setSearch("")} style={styles.clearBtn}>✕</button>}
        </div>
        <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} style={styles.select}>
          <option value="">All Categories</option>
          {categories.map((cat) => (
            <option key={cat._id} value={cat._id}>{cat.name}</option>
          ))}
        </select>
      </div>

      {loading && <Loading message="Loading products..." />}
      <ErrorBox message={error} onRetry={() => setSearch("")} />

      {/* Grid */}
      {!loading && (
        <div style={styles.scrollArea}>
          <div style={styles.grid}>
            {products.length === 0 && (
              <div style={styles.emptyBox}>
                <p style={styles.emptyIcon}>📦</p>
                <p style={styles.empty}>No products found</p>
              </div>
            )}
            {products.map((product) => {
              const inCart = cartItems.find((i) => i._id === product._id);
              const cartQty = inCart ? inCart.qty : 0;
              const remaining = product.type === "product" ? Number(product.stockQty) - cartQty : Infinity;
              const outOfStock = product.type === "product" && Number(product.stockQty) === 0;
              const cartFull = product.type === "product" && remaining <= 0;
              const lowStock = product.type === "product" && Number(product.stockQty) > 0 && Number(product.stockQty) <= 5;
              const isAnimating = animatingId === product._id;
              const isHovered = hoveredId === product._id;

              return (
                <div
                  key={product._id}
                  className={isAnimating ? "add-animate" : ""}
                  onMouseEnter={() => setHoveredId(product._id)}
                  onMouseLeave={() => setHoveredId(null)}
                  style={{
                    ...styles.card,
                    borderColor: cartFull ? "rgba(239,68,68,0.4)" : isHovered && !outOfStock ? "rgba(59,130,246,0.5)" : "rgba(255,255,255,0.06)",
                    boxShadow: isHovered && !outOfStock ? "0 8px 24px rgba(59,130,246,0.15)" : "0 2px 8px rgba(0,0,0,0.2)",
                    transform: isHovered && !outOfStock ? "translateY(-2px)" : "translateY(0)",
                    opacity: outOfStock ? 0.45 : 1,
                  }}
                >
                  {lowStock && <div style={styles.lowStockBadge}>⚠️ Low</div>}
                  {cartQty > 0 && <div style={styles.cartQtyBadge}>🛒 {cartQty}</div>}

                  <p style={styles.productName}>{product.name}</p>
                  <p style={styles.category}>{product.categoryId?.name || "—"}</p>
                  <p style={styles.price}>Rs {product.price?.toLocaleString()}</p>

                  {product.type === "product" && (
                    <p style={{ ...styles.stock, color: cartFull ? "#ef4444" : lowStock ? "#f59e0b" : "#22c55e" }}>
                      {outOfStock ? "Out of Stock" : cartFull ? "✋ Max" : `${remaining} left`}
                    </p>
                  )}
                  {product.type === "service" && (
                    <p style={{ ...styles.stock, color: "#818cf8" }}>Service</p>
                  )}

                  {/* ✅ Quick qty — loop nahi, qty direct pass */}
                  {!outOfStock && !cartFull && (
                    <div style={styles.qtyRow}>
                      {[1, 2, 3].filter((q) => q <= remaining).map((q) => (
                        <button
                          key={q}
                          onClick={(e) => { e.stopPropagation(); onAdd(product, q); }}
                          style={styles.qtyQuickBtn}
                        >
                          +{q}
                        </button>
                      ))}
                    </div>
                  )}

                  <button
                    onClick={(e) => { e.stopPropagation(); onAdd(product); }}
                    disabled={outOfStock || cartFull}
                    style={{
                      ...styles.addBtn,
                      background: outOfStock || cartFull ? "rgba(55,65,81,0.8)" : isHovered ? "linear-gradient(135deg, #1d4ed8, #2563eb)" : "rgba(37,99,235,0.7)",
                      cursor: outOfStock || cartFull ? "not-allowed" : "pointer",
                    }}
                  >
                    {outOfStock ? "Out of Stock" : cartFull ? "Max Reached" : "+ Add"}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  wrapper: {
    display: "flex", flexDirection: "column",
    flex: 1, overflow: "hidden", padding: "0 8px 8px",
  },
  headerRow: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10, flexShrink: 0 },
  heading: { fontSize: 16, fontWeight: "800", color: "#f1f5f9", margin: 0 },
  count: { fontSize: 11, color: "#334155", backgroundColor: "rgba(255,255,255,0.04)", padding: "2px 9px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.06)" },
  filterRow: { display: "flex", gap: 8, marginBottom: 10, flexShrink: 0 },
  searchWrapper: { flex: 1, position: "relative", display: "flex", alignItems: "center" },
  searchIcon: { position: "absolute", left: 9, fontSize: 13, pointerEvents: "none" },
  searchInput: { width: "100%", padding: "8px 32px 8px 30px", borderRadius: 9, border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.04)", color: "#f1f5f9", fontSize: 13, outline: "none", boxSizing: "border-box" },
  clearBtn: { position: "absolute", right: 7, background: "none", border: "none", color: "#334155", cursor: "pointer", fontSize: 13 },
  select: { padding: "8px 10px", borderRadius: 9, border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.04)", color: "#64748b", fontSize: 12, outline: "none" },
  scrollArea: { flex: 1, overflowY: "auto" },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 10 },
  emptyBox: { gridColumn: "1/-1", textAlign: "center", padding: 40 },
  emptyIcon: { fontSize: 36, marginBottom: 8 },
  empty: { color: "#334155", fontSize: 13 },
  card: {
    background: "rgba(255,255,255,0.03)", backdropFilter: "blur(12px)",
    border: "1px solid", borderRadius: 12, padding: 12,
    display: "flex", flexDirection: "column", gap: 3,
    transition: "all 0.2s ease", position: "relative", overflow: "hidden",
  },
  lowStockBadge: { position: "absolute", top: 7, right: 7, fontSize: 8, fontWeight: "700", backgroundColor: "rgba(245,158,11,0.15)", color: "#f59e0b", padding: "1px 5px", borderRadius: 5, border: "1px solid rgba(245,158,11,0.25)" },
  cartQtyBadge: { position: "absolute", top: 7, left: 7, fontSize: 8, fontWeight: "700", backgroundColor: "rgba(37,99,235,0.2)", color: "#60a5fa", padding: "1px 5px", borderRadius: 5, border: "1px solid rgba(37,99,235,0.3)" },
  productName: { fontWeight: "700", fontSize: 13, color: "#f1f5f9", marginTop: 2 },
  category: { fontSize: 10, color: "#334155" },
  price: { fontSize: 15, color: "#60a5fa", fontWeight: "800", margin: "3px 0" },
  stock: { fontSize: 10, fontWeight: "600" },
  qtyRow: { display: "flex", gap: 3, marginTop: 4 },
  qtyQuickBtn: { flex: 1, padding: "3px 0", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 5, color: "#475569", fontSize: 10, fontWeight: "700", cursor: "pointer" },
  addBtn: { marginTop: 5, padding: "7px 0", color: "#fff", border: "none", borderRadius: 7, fontSize: 12, fontWeight: "700", transition: "all 0.2s" },
};