import { useState } from "react";
import http from "../api/http";  // ✅ fixed
import { formatMoney } from "../utils/money";
import { todayInput, thirtyDaysAgoInput } from "../utils/date";
import Loading from "../components/common/Loading";
import ErrorBox from "../components/common/ErrorBox";

export default function Reports() {
  const [summary, setSummary] = useState(null);
  const [topItems, setTopItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [from, setFrom] = useState(thirtyDaysAgoInput());
  const [to, setTo] = useState(todayInput());
  const token = localStorage.getItem("token");

  const fetchReports = async () => {
    try {
      setLoading(true);
      setError("");
     const [summaryRes, topRes] = await Promise.all([
  http.get(`/reports/summary?from=${from}&to=${to}`),
  http.get(`/reports/top-items?from=${from}&to=${to}`),
]);
      setSummary(summaryRes.data || summaryRes);
      setTopItems(topRes.data || topRes || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <h2 style={styles.heading}>📈 Reports</h2>

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
        <button onClick={fetchReports} style={styles.searchBtn}>
          📊 Generate Report
        </button>
      </div>

      {loading && <Loading message="Generating report..." />}
      <ErrorBox message={error} onRetry={fetchReports} />

      {/* Summary Cards */}
      {summary && !loading && (
        <>
          <div style={styles.cardsGrid}>
            <div style={{ ...styles.card, borderTop: "4px solid #1976d2" }}>
              <p style={styles.cardLabel}>💰 Total Sales</p>
              <p style={styles.cardValue}>
                {formatMoney(summary.totalSales)}
              </p>
            </div>
            <div style={{ ...styles.card, borderTop: "4px solid #27ae60" }}>
              <p style={styles.cardLabel}>🧾 Total Orders</p>
              <p style={styles.cardValue}>{summary.totalOrders}</p>
            </div>
            <div style={{ ...styles.card, borderTop: "4px solid #f57c00" }}>
              <p style={styles.cardLabel}>📦 Avg Order Value</p>
              <p style={styles.cardValue}>
                {formatMoney(summary.avgOrder)}
              </p>
            </div>
            <div style={{ ...styles.card, borderTop: "4px solid #9c27b0" }}>
              <p style={styles.cardLabel}>🏷 Total Discount</p>
              <p style={styles.cardValue}>
                {formatMoney(summary.totalDiscount)}
              </p>
            </div>
            <div style={{ ...styles.card, borderTop: "4px solid #e53935" }}>
              <p style={styles.cardLabel}>🧮 Total Tax</p>
              <p style={styles.cardValue}>
                {formatMoney(summary.totalTax)}
              </p>
            </div>
          </div>

          {/* Top Items */}
          <div style={styles.topSection}>
            <h3 style={styles.sectionTitle}>🏆 Top Selling Items</h3>
            {topItems.length === 0 ? (
              <p style={styles.empty}>No data available.</p>
            ) : (
              <table style={styles.table}>
                <thead>
                  <tr style={styles.tableHead}>
                    <th style={{ ...styles.th, textAlign: "left" }}>#</th>
                    <th style={{ ...styles.th, textAlign: "left" }}>
                      Product Name
                    </th>
                    <th style={styles.th}>Qty Sold</th>
                    <th style={{ ...styles.th, textAlign: "right" }}>
                      Revenue
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {topItems.map((item, i) => (
                    <tr key={i} style={styles.tableRow}>
                      <td style={styles.td}>
                        <span
                          style={{
                            ...styles.rank,
                            backgroundColor:
                              i === 0
                                ? "#ffd700"
                                : i === 1
                                ? "#c0c0c0"
                                : i === 2
                                ? "#cd7f32"
                                : "#f0f0f0",
                            color: i < 3 ? "#fff" : "#888",
                          }}
                        >
                          {i + 1}
                        </span>
                      </td>
                      <td style={{ ...styles.td, fontWeight: "bold" }}>
                        {item.name}
                      </td>
                      <td style={{ ...styles.td, textAlign: "center" }}>
                        {item.qtySold}
                      </td>
                      <td
                        style={{
                          ...styles.td,
                          textAlign: "right",
                          color: "#1976d2",
                          fontWeight: "bold",
                        }}
                      >
                        {formatMoney(item.revenue)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}

      {/* Empty state */}
      {!summary && !loading && (
        <div style={styles.emptyState}>
          <p style={styles.emptyIcon}>📊</p>
          <p style={styles.emptyText}>
            Select date range and click Generate Report
          </p>
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
    marginBottom: 24, flexWrap: "wrap",
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
  cardsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
    gap: 16, marginBottom: 28,
  },
  card: {
    backgroundColor: "#fff", borderRadius: 12,
    padding: "20px 18px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.07)",
  },
  cardLabel: { fontSize: 13, color: "#888", marginBottom: 8 },
  cardValue: { fontSize: 22, fontWeight: "bold", color: "#222" },
  topSection: {
    backgroundColor: "#fff", borderRadius: 12,
    padding: 24, boxShadow: "0 2px 8px rgba(0,0,0,0.07)",
  },
  sectionTitle: {
    fontSize: 16, fontWeight: "bold",
    color: "#222", marginBottom: 16,
  },
  table: { width: "100%", borderCollapse: "collapse" },
  tableHead: { backgroundColor: "#f8f9fa" },
  tableRow: { borderBottom: "1px solid #f5f5f5" },
  th: {
    padding: "10px 16px", fontSize: 12,
    color: "#888", fontWeight: "bold",
    textTransform: "uppercase",
  },
  td: { padding: "13px 16px", fontSize: 14, color: "#444" },
  rank: {
    display: "inline-flex", alignItems: "center",
    justifyContent: "center", width: 26, height: 26,
    borderRadius: "50%", fontWeight: "bold", fontSize: 12,
  },
  empty: { color: "#aaa", padding: 20, textAlign: "center" },
  emptyState: {
    textAlign: "center", padding: "80px 20px",
  },
  emptyIcon: { fontSize: 60, marginBottom: 16 },
  emptyText: { color: "#aaa", fontSize: 16 },
};