import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import http from "../api/http";
import { formatMoney } from "../utils/money";
import { formatDate, todayInput, thirtyDaysAgoInput } from "../utils/date";
import Loading from "../components/common/Loading";
import ErrorBox from "../components/common/ErrorBox";

export default function SalesHistory() {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [from, setFrom] = useState(thirtyDaysAgoInput());
  const [to, setTo] = useState(todayInput());
  const [search, setSearch] = useState("");
  const navigate = useNavigate();

  const fetchSales = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await http.get(`/sales?from=${from}&to=${to}`);
      setSales(res.data || res || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchSales(); }, []);

  // ✅ Client side search filter
  const filtered = sales.filter((s) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      s.cashierId?.name?.toLowerCase().includes(q) ||
      s.paymentMethod?.toLowerCase().includes(q) ||
      s._id?.toLowerCase().includes(q)
    );
  });

  // ✅ Summary stats
// SalesHistory.jsx mein stats calculation wala part update karein:

// Jahan stats calculate ho rahi hain
// ✅ Yeh lines add karo filtered ke baad
const totalRevenue = filtered.reduce((sum, s) => sum + (s.total || 0), 0);
const totalOrders = filtered.length;
const avgOrder = totalOrders > 0 ? totalRevenue / totalOrders : 0; // ✅ yeh missing tha

  const paymentColor = (method) => {
    if (method === "cash") return { bg: "rgba(34,197,94,0.15)", color: "#4ade80", border: "rgba(34,197,94,0.3)" };
    if (method === "card") return { bg: "rgba(96,165,250,0.15)", color: "#60a5fa", border: "rgba(96,165,250,0.3)" };
    return { bg: "rgba(167,139,250,0.15)", color: "#a78bfa", border: "rgba(167,139,250,0.3)" };
  };

  return (
    <div style={styles.page}>
      {/* Header */}
      <div style={styles.header}>
        <div>
          <h2 style={styles.heading}>🧾 Sales History</h2>
          <p style={styles.subheading}>Track and manage all transactions</p>
        </div>
        <button onClick={() => navigate("/pos")} style={styles.newSaleBtn}>
          + New Sale
        </button>
      </div>

      {/* Filters */}
      <div style={styles.filterRow}>
        <div style={styles.filterField}>
          <label style={styles.label}>From</label>
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} style={styles.input} />
        </div>
        <div style={styles.filterField}>
          <label style={styles.label}>To</label>
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)} style={styles.input} />
        </div>
        <div style={styles.filterField}>
          <label style={styles.label}>Search</label>
          <input
            placeholder="Cashier, payment..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ ...styles.input, minWidth: 180 }}
          />
        </div>
        <button onClick={fetchSales} style={styles.searchBtn}>🔍 Search</button>
      </div>

      {/* ✅ Summary Cards */}
      {!loading && sales.length > 0 && (
        <div style={styles.statsRow}>
          <div style={styles.statCard}>
            <p style={styles.statLabel}>Total Revenue</p>
            <p style={{ ...styles.statValue, color: "#00f5ff" }}>{formatMoney(totalRevenue)}</p>
          </div>
          <div style={styles.statCard}>
            <p style={styles.statLabel}>Total Orders</p>
            <p style={{ ...styles.statValue, color: "#4ade80" }}>{totalOrders}</p>
          </div>
          <div style={styles.statCard}>
            <p style={styles.statLabel}>Avg Order Value</p>
            <p style={{ ...styles.statValue, color: "#fbbf24" }}>{formatMoney(avgOrder)}</p>
          </div>
          <div style={styles.statCard}>
            <p style={styles.statLabel}>Cash Sales</p>
            <p style={{ ...styles.statValue, color: "#4ade80" }}>
              {filtered.filter((s) => s.paymentMethod === "cash").length}
            </p>
          </div>
          <div style={styles.statCard}>
            <p style={styles.statLabel}>Card Sales</p>
            <p style={{ ...styles.statValue, color: "#60a5fa" }}>
              {filtered.filter((s) => s.paymentMethod === "card").length}
            </p>
          </div>
        </div>
      )}

      {loading && <Loading message="Loading sales..." />}
      <ErrorBox message={error} onRetry={fetchSales} />

      {/* Table */}
      {!loading && (
        <div style={styles.tableWrapper}>
          {filtered.length === 0 ? (
            <div style={styles.emptyBox}>
              <p style={styles.emptyIcon}>🧾</p>
              <p style={styles.empty}>No sales found for this period</p>
            </div>
          ) : (
            <table style={styles.table}>
              <thead>
                <tr>
                  {["#", "Date", "Cashier", "Items", "Payment", "Total", "Status", "Actions"].map((h) => (
                    <th key={h} style={styles.th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((sale, i) => {
                  const pc = paymentColor(sale.paymentMethod);
                  return (
                    <tr
                      key={sale._id}
                      style={styles.tableRow}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.03)"}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                    >
                      <td style={styles.td}>
                        <span style={styles.indexNum}>{i + 1}</span>
                      </td>
                      <td style={styles.td}>
                        <p style={styles.dateMain}>{formatDate(sale.createdAt).split(" ")[0]}</p>
                        <p style={styles.dateSub}>{formatDate(sale.createdAt).split(" ").slice(1).join(" ")}</p>
                      </td>
                      <td style={{ ...styles.td, color: "#e2e8f0", fontWeight: "600" }}>
                        {sale.cashierId?.name || "—"}
                      </td>
                      <td style={styles.td}>
                        <span style={styles.itemsBadge}>{sale.items?.length || 0} items</span>
                      </td>
                      <td style={styles.td}>
                        <span style={{ ...styles.payBadge, backgroundColor: pc.bg, color: pc.color, borderColor: pc.border }}>
                          {sale.paymentMethod?.toUpperCase()}
                        </span>
                      </td>
                      <td style={{ ...styles.td, color: "#00f5ff", fontWeight: "800", fontFamily: "monospace" }}>
                        {formatMoney(sale.total)}
                      </td>
                      <td style={styles.td}>
                        {sale.returned ? (
                          <span style={styles.returnedBadge}>↩ Returned</span>
                        ) : (
                          <span style={styles.completedBadge}>✓ Done</span>
                        )}
                      </td>
                      <td style={styles.td}>
                        <div style={styles.actionBtns}>
                          <button
                            onClick={() => navigate(`/sales/${sale._id}`)}
                            style={styles.viewBtn}
                          >
                            View
                          </button>
                          {!sale.returned && (
                            <button
                              onClick={() => navigate(`/sales/${sale._id}?return=true`)}
                              style={styles.returnBtn}
                            >
                              ↩ Return
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}

const styles = {
  page: { maxWidth: 1100, margin: "0 auto" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 },
  heading: { fontSize: 24, fontWeight: "bold", color: "#f1f5f9", margin: 0 },
  subheading: { fontSize: 13, color: "#4a5568", margin: "4px 0 0" },
  newSaleBtn: { padding: "10px 20px", backgroundColor: "#2563eb", color: "#fff", border: "none", borderRadius: 10, cursor: "pointer", fontSize: 14, fontWeight: "700" },

  filterRow: { display: "flex", gap: 12, alignItems: "flex-end", marginBottom: 20, flexWrap: "wrap" },
  filterField: { display: "flex", flexDirection: "column", gap: 4 },
  label: { fontSize: 11, color: "#64748b", fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.5 },
  input: { padding: "9px 12px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.1)", backgroundColor: "rgba(255,255,255,0.05)", color: "#f1f5f9", fontSize: 14, outline: "none" },
  searchBtn: { padding: "9px 20px", backgroundColor: "#2563eb", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontSize: 14, fontWeight: "700" },

  // ✅ Stats
  statsRow: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 12, marginBottom: 20 },
  statCard: { backgroundColor: "rgba(30,41,59,0.6)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, padding: "14px 16px" },
  statLabel: { fontSize: 11, color: "#4a5568", margin: "0 0 6px", textTransform: "uppercase", letterSpacing: 0.5 },
  statValue: { fontSize: 20, fontWeight: "800", margin: 0, fontFamily: "monospace" },

  tableWrapper: { borderRadius: 14, overflow: "hidden", border: "1px solid rgba(255,255,255,0.06)" },
  table: { width: "100%", borderCollapse: "collapse" },
  tableRow: { borderBottom: "1px solid rgba(255,255,255,0.04)", transition: "background 0.15s" },
  th: { padding: "12px 14px", textAlign: "left", fontSize: 10, color: "#4a5568", fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.5, backgroundColor: "rgba(255,255,255,0.03)", borderBottom: "1px solid rgba(255,255,255,0.06)" },
  td: { padding: "12px 14px", fontSize: 13, color: "#94a3b8", verticalAlign: "middle" },

  indexNum: { width: 28, height: 28, borderRadius: "50%", backgroundColor: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)", color: "#4a5568", fontSize: 11, fontWeight: "700", display: "inline-flex", alignItems: "center", justifyContent: "center" },
  dateMain: { margin: 0, color: "#e2e8f0", fontSize: 13, fontWeight: "600" },
  dateSub: { margin: 0, color: "#4a5568", fontSize: 11 },
  itemsBadge: { backgroundColor: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)", color: "#94a3b8", padding: "2px 8px", borderRadius: 20, fontSize: 11 },
  payBadge: { padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: "700", border: "1px solid" },

  completedBadge: { backgroundColor: "rgba(34,197,94,0.1)", color: "#4ade80", border: "1px solid rgba(34,197,94,0.2)", padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: "700" },
  returnedBadge: { backgroundColor: "rgba(239,68,68,0.1)", color: "#f87171", border: "1px solid rgba(239,68,68,0.2)", padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: "700" },

  actionBtns: { display: "flex", gap: 6 },
  viewBtn: { padding: "5px 12px", backgroundColor: "rgba(37,99,235,0.15)", color: "#60a5fa", border: "1px solid rgba(37,99,235,0.3)", borderRadius: 6, cursor: "pointer", fontSize: 12, fontWeight: "700" },
  returnBtn: { padding: "5px 12px", backgroundColor: "rgba(239,68,68,0.1)", color: "#f87171", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 6, cursor: "pointer", fontSize: 12, fontWeight: "700" },

  emptyBox: { textAlign: "center", padding: 60 },
  emptyIcon: { fontSize: 40, marginBottom: 8 },
  empty: { color: "#4a5568", fontSize: 14 },
};