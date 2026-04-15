import { useState, useEffect } from "react";
import http from "../../api/http";
import Loading from "../common/Loading";
import ErrorBox from "../common/ErrorBox";

export default function ProductList({ onAdd, animatingId }) {
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
        <h2 style={styles.heading}>🛒 Products</h2>
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
          {search && (
            <button onClick={() => setSearch("")} style={styles.clearBtn}>✕</button>
          )}
        </div>
        <select
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          style={styles.select}
        >
          <option value="">All Categories</option>
          {categories.map((cat) => (
            <option key={cat._id} value={cat._id}>{cat.name}</option>
          ))}
        </select>
      </div>

      {loading && <Loading message="Loading products..." />}
      <ErrorBox message={error} onRetry={() => setSearch("")} />

      {/* Product Cards */}
      {!loading && (
        <div style={styles.grid}>
          {products.length === 0 && (
            <div style={styles.emptyBox}>
              <p style={styles.emptyIcon}>📦</p>
              <p style={styles.empty}>No products found</p>
            </div>
          )}
          {products.map((product) => {
            const outOfStock = product.type === "product" && Number(product.stockQty) === 0;
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
                  borderColor: isHovered && !outOfStock ? "rgba(25,118,210,0.5)" : "rgba(255,255,255,0.08)",
                  boxShadow: isHovered && !outOfStock ? "0 8px 24px rgba(25,118,210,0.2)" : "0 2px 8px rgba(0,0,0,0.2)",
                  transform: isHovered && !outOfStock ? "translateY(-2px)" : "translateY(0)",
                  opacity: outOfStock ? 0.5 : 1,
                }}
              >
                {/* Low stock badge */}
                {lowStock && (
                  <div style={styles.lowStockBadge}>⚠️ Low</div>
                )}

                <p style={styles.productName}>{product.name}</p>
                <p style={styles.category}>{product.categoryId?.name || "—"}</p>
                <p style={styles.price}>Rs {product.price?.toLocaleString()}</p>

                {product.type === "product" && (
                  <p style={{ ...styles.stock, color: lowStock ? "#f59e0b" : outOfStock ? "#ef4444" : "#22c55e" }}>
                    {outOfStock ? "Out of Stock" : `Stock: ${product.stockQty}`}
                  </p>
                )}
                {product.type === "service" && (
                  <p style={{ ...styles.stock, color: "#818cf8" }}>Service</p>
                )}

                {/* ✅ Quick qty buttons 1-3 */}
                {!outOfStock && (
                  <div style={styles.qtyRow}>
                    {[1, 2, 3].map((q) => (
                      <button
                        key={q}
                        onClick={() => { for (let i = 0; i < q; i++) onAdd(product); }}
                        style={styles.qtyQuickBtn}
                        title={`Add ${q}`}
                      >
                        +{q}
                      </button>
                    ))}
                  </div>
                )}

                <button
                  onClick={() => onAdd(product)}
                  disabled={outOfStock}
                  style={{
                    ...styles.addBtn,
                    background: outOfStock ? "#374151" : isHovered ? "linear-gradient(135deg, #1976d2, #0d47a1)" : "rgba(25,118,210,0.8)",
                    cursor: outOfStock ? "not-allowed" : "pointer",
                  }}
                >
                  {outOfStock ? "Out of Stock" : "+ Add to Cart"}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

const styles = {
  wrapper: { flex: 1, overflowY: "auto", padding: "4px 8px" },
  headerRow: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  heading: { fontSize: 18, fontWeight: "bold", color: "#f1f5f9", margin: 0 },
  count: { fontSize: 12, color: "#4a5568", backgroundColor: "rgba(255,255,255,0.05)", padding: "3px 10px", borderRadius: 12, border: "1px solid rgba(255,255,255,0.08)" },
  filterRow: { display: "flex", gap: 10, marginBottom: 14 },
  searchWrapper: { flex: 1, position: "relative", display: "flex", alignItems: "center" },
  searchIcon: { position: "absolute", left: 10, fontSize: 14, pointerEvents: "none" },
  searchInput: {
    width: "100%", padding: "9px 36px 9px 32px", borderRadius: 10,
    border: "1px solid rgba(255,255,255,0.1)",
    background: "rgba(255,255,255,0.05)", color: "#f1f5f9",
    fontSize: 14, outline: "none", boxSizing: "border-box",
    transition: "border-color 0.2s",
  },
  clearBtn: { position: "absolute", right: 8, background: "none", border: "none", color: "#4a5568", cursor: "pointer", fontSize: 14 },
  select: {
    padding: "9px 12px", borderRadius: 10,
    border: "1px solid rgba(255,255,255,0.1)",
    background: "rgba(255,255,255,0.05)", color: "#94a3b8", fontSize: 13,
    outline: "none",
  },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 12 },
  emptyBox: { gridColumn: "1/-1", textAlign: "center", padding: 40 },
  emptyIcon: { fontSize: 40, marginBottom: 8 },
  empty: { color: "#4a5568", fontSize: 14 },
  card: {
    background: "rgba(255,255,255,0.04)",
    backdropFilter: "blur(12px)",
    border: "1px solid",
    borderRadius: 14, padding: 14,
    display: "flex", flexDirection: "column", gap: 4,
    transition: "all 0.2s ease",
    position: "relative", overflow: "hidden",
  },
  lowStockBadge: {
    position: "absolute", top: 8, right: 8,
    fontSize: 9, fontWeight: "700",
    backgroundColor: "rgba(245,158,11,0.2)",
    color: "#f59e0b", padding: "2px 6px",
    borderRadius: 6, border: "1px solid rgba(245,158,11,0.3)",
  },
  productName: { fontWeight: "bold", fontSize: 14, color: "#f1f5f9", marginTop: 4 },
  category: { fontSize: 11, color: "#4a5568" },
  price: { fontSize: 16, color: "#60a5fa", fontWeight: "bold", margin: "4px 0" },
  stock: { fontSize: 11, fontWeight: "600" },
  qtyRow: { display: "flex", gap: 4, marginTop: 6 },
  qtyQuickBtn: {
    flex: 1, padding: "4px 0",
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 6, color: "#94a3b8",
    fontSize: 11, fontWeight: "700", cursor: "pointer",
  },
  addBtn: {
    marginTop: 6, padding: "8px 0",
    color: "#fff", border: "none", borderRadius: 8,
    fontSize: 13, fontWeight: "bold",
    transition: "all 0.2s",
  },
};