import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import http from "../api/http";  // ✅ fixed
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
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

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

  useEffect(() => {
    fetchSales();
  }, []);

  return (
    <div style={styles.page}>
      <h2 style={styles.heading}>🧾 Sales History</h2>

      {/* Filters */}
      <div style={styles.filterRow}>
        <div style={styles.filterField}>
          <label style={styles.label}>From</label>
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            style={styles.input}
          />
        </div>
        <div style={styles.filterField}>
          <label style={styles.label}>To</label>
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            style={styles.input}
          />
        </div>
        <button onClick={fetchSales} style={styles.searchBtn}>
          🔍 Search
        </button>
      </div>

      {/* States */}
      {loading && <Loading message="Loading sales..." />}
      <ErrorBox message={error} onRetry={fetchSales} />

      {/* Table */}
      {!loading && (
        <div style={styles.tableWrapper}>
          {sales.length === 0 ? (
            <p style={styles.empty}>No sales found for this period.</p>
          ) : (
            <table style={styles.table}>
              <thead>
                <tr style={styles.tableHead}>
                  <th style={styles.th}>#</th>
                  <th style={styles.th}>Date</th>
                  <th style={styles.th}>Cashier</th>
                  <th style={styles.th}>Items</th>
                  <th style={styles.th}>Payment</th>
                  <th style={styles.th}>Total</th>
                  <th style={styles.th}>Action</th>
                </tr>
              </thead>
              <tbody>
                {sales.map((sale, i) => (
                  <tr key={sale._id} style={styles.tableRow}>
                    <td style={styles.td}>{i + 1}</td>
                    <td style={styles.td}>{formatDate(sale.createdAt)}</td>
                    <td style={styles.td}>
                      {sale.cashierId?.name || "—"}
                    </td>
                    <td style={styles.td}>
                      {sale.items?.length || 0} items
                    </td>
                    <td style={styles.td}>
                      <span
                        style={{
                          ...styles.badge,
                          backgroundColor:
                            sale.paymentMethod === "cash"
                              ? "#e8f5e9"
                              : sale.paymentMethod === "card"
                              ? "#e3f2fd"
                              : "#fff3e0",
                          color:
                            sale.paymentMethod === "cash"
                              ? "#27ae60"
                              : sale.paymentMethod === "card"
                              ? "#1976d2"
                              : "#f57c00",
                        }}
                      >
                        {sale.paymentMethod?.toUpperCase()}
                      </span>
                    </td>
                    <td style={{ ...styles.td, fontWeight: "bold", color: "#1976d2" }}>
                      {formatMoney(sale.total)}
                    </td>
                    <td style={styles.td}>
                      <button
                        onClick={() => navigate(`/sales/${sale._id}`)}
                        style={styles.viewBtn}
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}

const styles = {
  page: { maxWidth: 1000, margin: "0 auto" },
  heading: { fontSize: 22, fontWeight: "bold", marginBottom: 20, color: "#222" },
  filterRow: {
    display: "flex", gap: 14, alignItems: "flex-end",
    marginBottom: 20, flexWrap: "wrap",
  },
  filterField: { display: "flex", flexDirection: "column", gap: 4 },
  label: { fontSize: 12, color: "#666", fontWeight: "bold" },
  input: {
    padding: "8px 12px", borderRadius: 8,
    border: "1px solid #ddd", fontSize: 14,
  },
  searchBtn: {
    padding: "9px 20px", backgroundColor: "#1976d2",
    color: "#fff", border: "none", borderRadius: 8,
    cursor: "pointer", fontSize: 14, fontWeight: "bold",
  },
  tableWrapper: {
    backgroundColor: "#fff", borderRadius: 12,
    boxShadow: "0 2px 8px rgba(0,0,0,0.08)", overflow: "hidden",
  },
  table: { width: "100%", borderCollapse: "collapse" },
  tableHead: { backgroundColor: "#f8f9fa" },
  tableRow: {
    borderBottom: "1px solid #f0f0f0",
    transition: "background 0.15s",
  },
  th: {
    padding: "13px 16px", textAlign: "left",
    fontSize: 12, color: "#888", fontWeight: "bold",
    textTransform: "uppercase", letterSpacing: 0.5,
  },
  td: { padding: "13px 16px", fontSize: 14, color: "#444" },
  badge: {
    padding: "3px 10px", borderRadius: 20,
    fontSize: 11, fontWeight: "bold",
  },
  viewBtn: {
    padding: "6px 14px", backgroundColor: "#f0f7ff",
    color: "#1976d2", border: "1px solid #bbdefb",
    borderRadius: 7, cursor: "pointer", fontSize: 13,
    fontWeight: "bold",
  },
  empty: { padding: 40, textAlign: "center", color: "#aaa", fontSize: 15 },
};