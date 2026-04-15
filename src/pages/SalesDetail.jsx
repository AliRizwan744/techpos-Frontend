import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import http from "../api/http";  // ✅ fixed
import { formatMoney } from "../utils/money";
import { formatDate } from "../utils/date";
import Loading from "../components/common/Loading";
import ErrorBox from "../components/common/ErrorBox";

export default function SaleDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [sale, setSale] = useState(null);
  const [store, setStore] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const token = localStorage.getItem("token");

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [saleRes, storeRes] = await Promise.all([
          get(`/sales/${id}`, token),
          get("/store", token),
        ]);
        setSale(saleRes.data || saleRes);
        setStore(storeRes.data || storeRes);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  if (loading) return <Loading message="Loading sale details..." />;
  if (error) return <ErrorBox message={error} />;
  if (!sale) return null;

  return (
    <div style={styles.page}>
      {/* Top Bar */}
      <div style={styles.topBar} className="no-print">
        <button onClick={() => navigate(-1)} style={styles.backBtn}>
          ← Back
        </button>
        <h2 style={styles.heading}>🧾 Sale Details</h2>
        <button onClick={() => window.print()} style={styles.printBtn}>
          🖨 Print
        </button>
      </div>

      {/* Detail Card */}
      <div style={styles.card}>
        {/* Sale Meta Info */}
        <div style={styles.metaGrid}>
          <div style={styles.metaItem}>
            <span style={styles.metaLabel}>Receipt #</span>
            <span style={styles.metaValue}>
              {sale._id?.slice(-8).toUpperCase()}
            </span>
          </div>
          <div style={styles.metaItem}>
            <span style={styles.metaLabel}>Date & Time</span>
            <span style={styles.metaValue}>{formatDate(sale.createdAt)}</span>
          </div>
          <div style={styles.metaItem}>
            <span style={styles.metaLabel}>Cashier</span>
            <span style={styles.metaValue}>
              {sale.cashierId?.name || "—"}
            </span>
          </div>
          <div style={styles.metaItem}>
            <span style={styles.metaLabel}>Payment Method</span>
            <span
              style={{
                ...styles.metaValue,
                ...styles.badge,
                backgroundColor:
                  sale.paymentMethod === "cash" ? "#e8f5e9" : "#e3f2fd",
                color:
                  sale.paymentMethod === "cash" ? "#27ae60" : "#1976d2",
              }}
            >
              {sale.paymentMethod?.toUpperCase()}
            </span>
          </div>
        </div>

        <div style={styles.divider} />

        {/* Items Table */}
        <h3 style={styles.sectionTitle}>Items Sold</h3>
        <table style={styles.table}>
          <thead>
            <tr style={styles.tableHead}>
              <th style={{ ...styles.th, textAlign: "left" }}>#</th>
              <th style={{ ...styles.th, textAlign: "left" }}>Product</th>
              <th style={styles.th}>Unit Price</th>
              <th style={styles.th}>Qty</th>
              <th style={{ ...styles.th, textAlign: "right" }}>Total</th>
            </tr>
          </thead>
          <tbody>
            {sale.items?.map((item, i) => (
              <tr key={i} style={styles.tableRow}>
                <td style={styles.td}>{i + 1}</td>
                <td style={{ ...styles.td, fontWeight: "bold" }}>
                  {item.name}
                </td>
                <td style={{ ...styles.td, textAlign: "center" }}>
                  {formatMoney(item.price, store?.currency)}
                </td>
                <td style={{ ...styles.td, textAlign: "center" }}>
                  {item.qty}
                </td>
                <td style={{ ...styles.td, textAlign: "right", color: "#1976d2", fontWeight: "bold" }}>
                  {formatMoney(item.price * item.qty, store?.currency)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div style={styles.divider} />

        {/* Totals Summary */}
        <div style={styles.totalsBox}>
          <div style={styles.totalRow}>
            <span style={styles.totalLabel}>Subtotal</span>
            <span>{formatMoney(sale.subtotal, store?.currency)}</span>
          </div>
          {sale.discount > 0 && (
            <div style={{ ...styles.totalRow, color: "#27ae60" }}>
              <span style={styles.totalLabel}>Discount</span>
              <span>− {formatMoney(sale.discount, store?.currency)}</span>
            </div>
          )}
          {sale.taxAmount > 0 && (
            <div style={styles.totalRow}>
              <span style={styles.totalLabel}>
                Tax ({sale.taxPercent}%)
              </span>
              <span>{formatMoney(sale.taxAmount, store?.currency)}</span>
            </div>
          )}
          <div style={{ ...styles.totalRow, ...styles.grandTotal }}>
            <span>Grand Total</span>
            <span>{formatMoney(sale.total, store?.currency)}</span>
          </div>
          {sale.paymentMethod === "cash" && (
            <>
              <div style={styles.totalRow}>
                <span style={styles.totalLabel}>Amount Paid</span>
                <span>
                  {formatMoney(sale.amountPaid, store?.currency)}
                </span>
              </div>
              <div style={{ ...styles.totalRow, color: "#1976d2" }}>
                <span style={styles.totalLabel}>Change Returned</span>
                <span>
                  {formatMoney(
                    sale.amountPaid - sale.total,
                    store?.currency
                  )}
                </span>
              </div>
            </>
          )}
        </div>
      </div>

      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white; }
        }
      `}</style>
    </div>
  );
}

const styles = {
  page: { maxWidth: 800, margin: "0 auto" },
  topBar: {
    display: "flex", alignItems: "center",
    gap: 16, marginBottom: 20,
  },
  heading: { fontSize: 22, fontWeight: "bold", flex: 1, color: "#222" },
  backBtn: {
    padding: "8px 16px", backgroundColor: "#f5f5f5",
    color: "#555", border: "1px solid #ddd",
    borderRadius: 8, cursor: "pointer", fontSize: 14,
  },
  printBtn: {
    padding: "8px 16px", backgroundColor: "#1976d2",
    color: "#fff", border: "none",
    borderRadius: 8, cursor: "pointer", fontSize: 14, fontWeight: "bold",
  },
  card: {
    backgroundColor: "#fff", borderRadius: 14,
    padding: 28, boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
  },
  metaGrid: {
    display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: 16, marginBottom: 4,
  },
  metaItem: { display: "flex", flexDirection: "column", gap: 4 },
  metaLabel: { fontSize: 11, color: "#aaa", textTransform: "uppercase", letterSpacing: 0.5 },
  metaValue: { fontSize: 15, fontWeight: "bold", color: "#222" },
  badge: {
    display: "inline-block", padding: "3px 12px",
    borderRadius: 20, fontSize: 12,
  },
  divider: { borderTop: "1px solid #f0f0f0", margin: "20px 0" },
  sectionTitle: { fontSize: 15, fontWeight: "bold", color: "#555", marginBottom: 12 },
  table: { width: "100%", borderCollapse: "collapse" },
  tableHead: { backgroundColor: "#f8f9fa" },
  tableRow: { borderBottom: "1px solid #f5f5f5" },
  th: {
    padding: "10px 14px", fontSize: 12,
    color: "#888", fontWeight: "bold",
    textTransform: "uppercase",
  },
  td: { padding: "12px 14px", fontSize: 14, color: "#444" },
  totalsBox: {
    maxWidth: 320, marginLeft: "auto",
    display: "flex", flexDirection: "column", gap: 10,
  },
  totalRow: {
    display: "flex", justifyContent: "space-between",
    fontSize: 14, color: "#555",
  },
  totalLabel: { color: "#888" },
  grandTotal: {
    fontWeight: "bold", fontSize: 17,
    color: "#222", paddingTop: 8,
    borderTop: "2px solid #eee",
  },
};