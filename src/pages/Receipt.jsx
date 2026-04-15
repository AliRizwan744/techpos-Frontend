import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import http from "../api/http";  // ✅ fixed
import { formatMoney } from "../utils/money";
import { formatDate } from "../utils/date";
import Loading from "../components/common/Loading";
import ErrorBox from "../components/common/ErrorBox";

export default function Receipt() {
  const { saleId } = useParams();
  const navigate = useNavigate();
  const [sale, setSale] = useState(null);
  const [store, setStore] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [saleRes, storeRes] = await Promise.all([
          http.get(`/sales/${saleId}`),  // ✅ fixed
          http.get("/store"),             // ✅ fixed
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
  }, [saleId]);

  const handlePrint = () => window.print();

  if (loading) return <Loading message="Loading receipt..." />;
  if (error) return <ErrorBox message={error} />;
  if (!sale) return null;

  return (
    <div style={styles.page}>
      <div style={styles.actions} className="no-print">
        <button onClick={handlePrint} style={styles.printBtn}>🖨 Print Receipt</button>
        <button onClick={() => navigate("/pos")} style={styles.newSaleBtn}>+ New Sale</button>
        <button onClick={() => navigate("/sales")} style={styles.historyBtn}>📋 Sales History</button>
      </div>

      <div style={styles.receipt} id="receipt">
        <div style={styles.header}>
          <h2 style={styles.storeName}>{store?.name || "Tech POS"}</h2>
          {store?.address && <p style={styles.storeInfo}>{store.address}</p>}
          {store?.phone && <p style={styles.storeInfo}>{store.phone}</p>}
          <p style={styles.storeInfo}>Currency: {store?.currency || "Rs"}</p>
        </div>

        <div style={styles.divider} />

        <div style={styles.saleInfo}>
          <div style={styles.infoRow}>
            <span style={styles.infoLabel}>Receipt #</span>
            <span style={styles.infoValue}>{sale._id?.slice(-8).toUpperCase()}</span>
          </div>
          <div style={styles.infoRow}>
            <span style={styles.infoLabel}>Date</span>
            <span style={styles.infoValue}>{formatDate(sale.createdAt)}</span>
          </div>
          <div style={styles.infoRow}>
            <span style={styles.infoLabel}>Cashier</span>
            <span style={styles.infoValue}>{sale.cashierId?.name || "—"}</span>
          </div>
          <div style={styles.infoRow}>
            <span style={styles.infoLabel}>Payment</span>
            <span style={styles.infoValue}>{sale.paymentMethod?.toUpperCase()}</span>
          </div>
        </div>

        <div style={styles.divider} />

        <table style={styles.table}>
          <thead>
            <tr>
              <th style={{ ...styles.th, textAlign: "left" }}>Item</th>
              <th style={styles.th}>Qty</th>
              <th style={styles.th}>Price</th>
              <th style={{ ...styles.th, textAlign: "right" }}>Total</th>
            </tr>
          </thead>
          <tbody>
            {sale.items?.map((item, i) => (
              <tr key={i}>
                <td style={{ ...styles.td, textAlign: "left" }}>{item.name}</td>
                <td style={styles.td}>{item.qty}</td>
                <td style={styles.td}>{formatMoney(item.price, store?.currency)}</td>
                <td style={{ ...styles.td, textAlign: "right" }}>{formatMoney(item.price * item.qty, store?.currency)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div style={styles.divider} />

        <div style={styles.totals}>
          <div style={styles.totalRow}>
            <span>Subtotal</span>
            <span>{formatMoney(sale.subtotal, store?.currency)}</span>
          </div>
          {sale.discount > 0 && (
            <div style={{ ...styles.totalRow, color: "#27ae60" }}>
              <span>Discount</span>
              <span>− {formatMoney(sale.discount, store?.currency)}</span>
            </div>
          )}
          {sale.taxAmount > 0 && (
            <div style={styles.totalRow}>
              <span>Tax ({sale.taxPercent}%)</span>
              <span>{formatMoney(sale.taxAmount, store?.currency)}</span>
            </div>
          )}
          <div style={{ ...styles.totalRow, ...styles.grandTotal }}>
            <span>TOTAL</span>
            <span>{formatMoney(sale.total, store?.currency)}</span>
          </div>
          {sale.paymentMethod === "cash" && (
            <>
              <div style={styles.totalRow}>
                <span>Amount Paid</span>
                <span>{formatMoney(sale.amountPaid, store?.currency)}</span>
              </div>
              <div style={{ ...styles.totalRow, color: "#1976d2" }}>
                <span>Change</span>
                <span>{formatMoney(sale.amountPaid - sale.total, store?.currency)}</span>
              </div>
            </>
          )}
        </div>

        <div style={styles.divider} />

        <p style={styles.footer}>{store?.receiptFooter || "Thank you for your business!"}</p>
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
  page: { display: "flex", flexDirection: "column", alignItems: "center", padding: "20px 16px" },
  actions: { display: "flex", gap: 12, marginBottom: 20 },
  printBtn: { padding: "10px 20px", backgroundColor: "#1976d2", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontSize: 14, fontWeight: "bold" },
  newSaleBtn: { padding: "10px 20px", backgroundColor: "#27ae60", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontSize: 14, fontWeight: "bold" },
  historyBtn: { padding: "10px 20px", backgroundColor: "#f5f5f5", color: "#555", border: "1px solid #ddd", borderRadius: 8, cursor: "pointer", fontSize: 14 },
  receipt: { backgroundColor: "#fff", width: "100%", maxWidth: 420, padding: "28px 24px", borderRadius: 12, boxShadow: "0 4px 16px rgba(0,0,0,0.1)", fontFamily: "monospace" },
  header: { textAlign: "center", marginBottom: 12 },
  storeName: { fontSize: 20, fontWeight: "bold", marginBottom: 4 },
  storeInfo: { fontSize: 12, color: "#666", margin: "2px 0" },
  divider: { borderTop: "1px dashed #ccc", margin: "12px 0" },
  saleInfo: { display: "flex", flexDirection: "column", gap: 6 },
  infoRow: { display: "flex", justifyContent: "space-between" },
  infoLabel: { fontSize: 12, color: "#888" },
  infoValue: { fontSize: 12, fontWeight: "bold" },
  table: { width: "100%", borderCollapse: "collapse" },
  th: { fontSize: 11, color: "#888", textAlign: "center", paddingBottom: 6, borderBottom: "1px solid #eee" },
  td: { fontSize: 13, padding: "6px 4px", textAlign: "center", borderBottom: "1px solid #f5f5f5" },
  totals: { display: "flex", flexDirection: "column", gap: 8 },
  totalRow: { display: "flex", justifyContent: "space-between", fontSize: 13, color: "#444" },
  grandTotal: { fontWeight: "bold", fontSize: 16, color: "#222", marginTop: 4 },
  footer: { textAlign: "center", fontSize: 13, color: "#888", marginTop: 4 },
};