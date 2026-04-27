import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import http from "../api/http";
import { formatMoney } from "../utils/money";
import { formatDate } from "../utils/date";
import Loading from "../components/common/Loading";
import ErrorBox from "../components/common/ErrorBox";

export default function SaleDetails() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const autoReturn = searchParams.get("return") === "true";
  const navigate = useNavigate();
  const returnRef = useRef(null);
  const isReturningRef = useRef(false);

  const [sale, setSale] = useState(null);
  const [store, setStore] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [returning, setReturning] = useState(false);
  const [returnSuccess, setReturnSuccess] = useState(null);
  const [selectedItems, setSelectedItems] = useState({});
  const [returnError, setReturnError] = useState("");

  // Data Fetching logic
  const fetchData = async () => {
    try {
      setLoading(true);
      const [saleRes, storeRes] = await Promise.all([
        http.get(`/sales/${id}`),
        http.get("/store"),
      ]);
      
      // Response handling structured
      setSale(saleRes.data?.data || saleRes.data || saleRes);
      setStore(storeRes.data?.data || storeRes.data || storeRes);
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  useEffect(() => {
    if (autoReturn && !loading && returnRef.current) {
      setTimeout(() => returnRef.current.scrollIntoView({ behavior: "smooth" }), 400);
    }
  }, [autoReturn, loading]);

  const handleQtyChange = (index, val, maxQty) => {
    const num = Math.min(Math.max(0, Number(val)), maxQty);
    setSelectedItems((prev) => ({ ...prev, [index]: num }));
  };

  // ✅ Main Return Process Function
  const handleReturn = async () => {
    if (isReturningRef.current) return;
    
    const itemsToReturn = Object.entries(selectedItems)
      .filter(([, qty]) => qty > 0)
      .map(([itemIndex, qty]) => ({
        productId: sale.items[itemIndex].productId,
        name: sale.items[itemIndex].name,
        price: sale.items[itemIndex].price,
        qty: Number(qty),
      }));

    if (itemsToReturn.length === 0) {
      setReturnError("Koi item select nahi kiya");
      return;
    }

    try {
      isReturningRef.current = true;
      setReturning(true);
      setReturnError("");

      const res = await http.post(`/sales/${id}/return`, { returnItems: itemsToReturn });
      const responseData = res.data?.data || res.data || res;

      const returnSubtotal = itemsToReturn.reduce((s, i) => s + i.price * i.qty, 0);

      setReturnSuccess({
        items: itemsToReturn,
        returnSubtotal,
        deduction: returnSubtotal * 0.2,
        refundAmount: responseData.totalRefund || (returnSubtotal * 0.8),
      });

      setSelectedItems({});
      window.scrollTo({ top: 0, behavior: "smooth" });
      
      // Re-fetch sale to update UI
      await fetchData();

    } catch (err) {
      console.error("Return Error:", err);
      setReturnError(err.response?.data?.message || "Return process fail ho gaya");
    } finally {
      setReturning(false);
      isReturningRef.current = false;
    }
  };

  const hasSelected = Object.values(selectedItems).some((q) => q > 0);

  if (loading) return <Loading message="Loading sale details..." />;
  if (error) return <ErrorBox message={error} />;
  if (!sale) return null;

  return (
    <div style={styles.page}>
      <div style={styles.topBar} className="no-print">
        <button onClick={() => navigate(-1)} style={styles.backBtn}>← Back</button>
        <h2 style={styles.heading}>🧾 Sale Details</h2>
        <div style={{ display: "flex", gap: 8 }}>
          {!sale.returned && (
            <button
              onClick={() => returnRef.current?.scrollIntoView({ behavior: "smooth" })}
              style={styles.returnNavBtn}
            >
              ↩ Return
            </button>
          )}
          <button onClick={() => window.print()} style={styles.printBtn}>🖨 Print</button>
        </div>
      </div>

      {returnSuccess && (
        <div style={styles.successBanner}>
          <div style={{ flex: 1 }}>
            <h3 style={styles.successTitle}>✅ Return Processed</h3>
            <p style={styles.successSub}>
              {returnSuccess.items.map((i) => `${i.name} x${i.qty}`).join(", ")}
            </p>
          </div>
          <div style={styles.successBreakdown}>
            <div style={styles.successRow}>
              <span style={styles.successLabel}>Return Value</span>
              <span style={styles.successVal}>{formatMoney(returnSuccess.returnSubtotal, store?.currency)}</span>
            </div>
            <div style={styles.successRow}>
              <span style={styles.successLabel}>20% Deduction</span>
              <span style={{ ...styles.successVal, color: "#f87171" }}>
                − {formatMoney(returnSuccess.deduction, store?.currency)}
              </span>
            </div>
            <div style={styles.successRow}>
              <span style={styles.successLabel}>Refund</span>
              <span style={{ ...styles.successVal, color: "#4ade80", fontSize: 16 }}>
                {formatMoney(returnSuccess.refundAmount, store?.currency)}
              </span>
            </div>
          </div>
          <button onClick={() => setReturnSuccess(null)} style={styles.dismissBtn}>✕</button>
        </div>
      )}

      {sale.returned && (
        <div style={styles.alreadyReturned}>
          ↩ This sale was fully/partially returned. 
          {sale.totalRefund > 0 && ` Total Refunded: ${formatMoney(sale.totalRefund, store?.currency)}`}
        </div>
      )}

      <div style={styles.card}>
        <div style={styles.metaGrid}>
          {[
            { label: "Receipt #", value: sale._id?.slice(-8).toUpperCase() },
            { label: "Date & Time", value: formatDate(sale.createdAt) },
            { label: "Cashier", value: sale.cashierId?.name || "—" },
            { label: "Payment", value: sale.paymentMethod?.toUpperCase(), isPayment: true },
          ].map((m) => (
            <div key={m.label} style={styles.metaItem}>
              <span style={styles.metaLabel}>{m.label}</span>
              {m.isPayment ? (
                <span style={{
                  ...styles.metaValue,
                  backgroundColor: sale.paymentMethod === "cash" ? "rgba(34,197,94,0.15)" : "rgba(96,165,250,0.15)",
                  color: sale.paymentMethod === "cash" ? "#4ade80" : "#60a5fa",
                  padding: "3px 12px", borderRadius: 20, fontSize: 12, display: "inline-block",
                }}>
                  {m.value}
                </span>
              ) : (
                <span style={styles.metaValue}>{m.value}</span>
              )}
            </div>
          ))}
        </div>

        <div style={styles.divider} />

        <h3 style={styles.sectionTitle}>Items Sold</h3>
        <table style={styles.table}>
          <thead>
            <tr>
              {["#", "Product", "Unit Price", "Qty", "Total"].map((h) => (
                <th key={h} style={styles.th}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sale.items?.map((item, i) => (
              <tr key={i} style={styles.tableRow}>
                <td style={styles.td}>{i + 1}</td>
                <td style={{ ...styles.td, color: "#f1f5f9", fontWeight: "600" }}>{item.name}</td>
                <td style={{ ...styles.td, textAlign: "center" }}>{formatMoney(item.price, store?.currency)}</td>
                <td style={{ ...styles.td, textAlign: "center" }}>{item.qty}</td>
                <td style={{ ...styles.td, textAlign: "right", color: "#60a5fa", fontWeight: "bold" }}>
                  {formatMoney(item.price * item.qty, store?.currency)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div style={styles.divider} />

        <div style={styles.totalsBox}>
          <div style={styles.totalRow}>
            <span style={styles.totalLabel}>Subtotal</span>
            <span style={styles.totalValue}>{formatMoney(sale.subtotal, store?.currency)}</span>
          </div>
          {sale.discount > 0 && (
            <div style={styles.totalRow}>
              <span style={styles.totalLabel}>Discount</span>
              <span style={{ ...styles.totalValue, color: "#4ade80" }}>
                − {formatMoney(sale.discount, store?.currency)}
              </span>
            </div>
          )}
          <div style={styles.grandRow}>
            <span style={styles.grandLabel}>Grand Total</span>
            <span style={styles.grandAmount}>{formatMoney(sale.total, store?.currency)}</span>
          </div>
          
          {sale.totalRefund > 0 && (
            <div style={{ ...styles.totalRow, marginTop: 8, paddingTop: 8, borderTop: "1px solid rgba(255,255,255,0.06)" }}>
              <span style={{ ...styles.totalLabel, color: "#f87171" }}>Total Refunded</span>
              <span style={{ ...styles.totalValue, color: "#f87171" }}>
                − {formatMoney(sale.totalRefund, store?.currency)}
              </span>
            </div>
          )}
        </div>
      </div>

      {!sale.returned && (
        <div ref={returnRef} style={styles.returnCard}>
          <div style={styles.returnHeader}>
            <div>
              <h3 style={styles.returnTitle}>↩ Return Items</h3>
              <p style={styles.returnSubtitle}>20% deduction applies — select qty to return</p>
            </div>
            {hasSelected && (
              <div style={styles.returnPreview}>
                <span style={styles.returnPreviewLabel}>Estimated Refund:</span>
                <span style={styles.returnPreviewAmount}>
                  {formatMoney(
                    Object.entries(selectedItems)
                      .filter(([, q]) => q > 0)
                      .reduce((sum, [i, q]) => sum + (sale.items[i]?.price || 0) * q, 0) * 0.8,
                    store?.currency
                  )}
                </span>
              </div>
            )}
          </div>

          {returnError && <div style={styles.returnErrorBox}>⚠️ {returnError}</div>}

          <div style={styles.returnItemsList}>
            {sale.items?.map((item, i) => {
              // Calculate remaining qty that can be returned
              const previouslyReturned = sale.returnItems
                ?.filter(r => r.productId === item.productId)
                .reduce((sum, r) => sum + r.qty, 0) || 0;
              const availableQty = item.qty - previouslyReturned;

              if (availableQty <= 0) return null;

              return (
                <div key={i} style={styles.returnItem}>
                  <div style={styles.returnItemInfo}>
                    <p style={styles.returnItemName}>{item.name}</p>
                    <p style={styles.returnItemMeta}>
                      Available: {availableQty} of {item.qty}
                    </p>
                  </div>
                  <div style={styles.returnQtyBox}>
                    <span style={styles.returnQtyLabel}>Return Qty</span>
                    <div style={styles.returnQtyControls}>
                      <button
                        onClick={() => handleQtyChange(i, (selectedItems[i] || 0) - 1, availableQty)}
                        style={styles.returnQtyBtn}
                        disabled={(selectedItems[i] || 0) === 0}
                      >−</button>
                      <input
                        type="number"
                        value={selectedItems[i] || 0}
                        onChange={(e) => handleQtyChange(i, e.target.value, availableQty)}
                        style={styles.returnQtyInput}
                        readOnly
                      />
                      <button
                        onClick={() => handleQtyChange(i, (selectedItems[i] || 0) + 1, availableQty)}
                        style={styles.returnQtyBtn}
                        disabled={(selectedItems[i] || 0) >= availableQty}
                      >+</button>
                    </div>
                  </div>
                  {selectedItems[i] > 0 && (
                    <div style={styles.returnItemCalc}>
                      <p style={styles.returnItemCalcLabel}>Refund (80%)</p>
                      <p style={styles.returnItemCalcValue}>
                        {formatMoney(item.price * selectedItems[i] * 0.8, store?.currency)}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <button
            onClick={handleReturn}
            disabled={returning || !hasSelected}
            style={{
              ...styles.processReturnBtn,
              opacity: returning || !hasSelected ? 0.4 : 1,
            }}
          >
            {returning ? "Processing..." : "Confirm Return"}
          </button>
        </div>
      )}

      <style>{`
        @media print { .no-print { display: none !important; } body { background: white; color: black; } }
      `}</style>
    </div>
  );
}

// ... styles object remains the same as your original file
const styles = {
  page: { maxWidth: 900, margin: "0 auto", paddingBottom: 40 },
  topBar: { display: "flex", alignItems: "center", gap: 12, marginBottom: 20 },
  heading: { fontSize: 22, fontWeight: "bold", flex: 1, color: "#f1f5f9" },
  backBtn: { padding: "8px 16px", backgroundColor: "rgba(255,255,255,0.06)", color: "#94a3b8", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, cursor: "pointer", fontSize: 14 },
  returnNavBtn: { padding: "8px 16px", backgroundColor: "rgba(239,68,68,0.15)", color: "#f87171", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 8, cursor: "pointer", fontSize: 14, fontWeight: "700" },
  printBtn: { padding: "8px 16px", backgroundColor: "#1976d2", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontSize: 14, fontWeight: "bold" },
  successBanner: { display: "flex", alignItems: "flex-start", gap: 16, backgroundColor: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.25)", borderRadius: 14, padding: "20px 24px", marginBottom: 20 },
  successTitle: { fontSize: 16, fontWeight: "800", color: "#4ade80", margin: "0 0 4px" },
  successSub: { fontSize: 13, color: "#86efac", margin: 0 },
  successBreakdown: { display: "flex", flexDirection: "column", gap: 6, minWidth: 200 },
  successRow: { display: "flex", justifyContent: "space-between", gap: 12 },
  successLabel: { fontSize: 12, color: "#64748b" },
  successVal: { fontSize: 13, color: "#e2e8f0", fontWeight: "700", fontFamily: "monospace" },
  dismissBtn: { background: "none", border: "none", color: "#4a5568", cursor: "pointer", fontSize: 18 },
  alreadyReturned: { backgroundColor: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 10, padding: "12px 18px", marginBottom: 16, color: "#f87171", fontSize: 13, fontWeight: "600" },
  card: { backgroundColor: "rgba(30,41,59,0.8)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 14, padding: 28, marginBottom: 24 },
  metaGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 16, marginBottom: 4 },
  metaItem: { display: "flex", flexDirection: "column", gap: 4 },
  metaLabel: { fontSize: 11, color: "#64748b", textTransform: "uppercase", letterSpacing: 0.5 },
  metaValue: { fontSize: 15, fontWeight: "bold", color: "#f1f5f9" },
  divider: { borderTop: "1px solid rgba(255,255,255,0.06)", margin: "20px 0" },
  sectionTitle: { fontSize: 13, fontWeight: "700", color: "#64748b", margin: "0 0 14px", textTransform: "uppercase", letterSpacing: 1 },
  table: { width: "100%", borderCollapse: "collapse" },
  tableRow: { borderBottom: "1px solid rgba(255,255,255,0.04)" },
  th: { padding: "10px 14px", fontSize: 11, color: "#4a5568", fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.5, borderBottom: "1px solid rgba(255,255,255,0.06)", textAlign: "left" },
  td: { padding: "12px 14px", fontSize: 14, color: "#94a3b8" },
  totalsBox: { maxWidth: 340, marginLeft: "auto", display: "flex", flexDirection: "column", gap: 10 },
  totalRow: { display: "flex", justifyContent: "space-between", fontSize: 14 },
  totalLabel: { color: "#64748b" },
  totalValue: { color: "#e2e8f0", fontWeight: "600" },
  grandRow: { display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 10, borderTop: "1px solid rgba(255,255,255,0.08)" },
  grandLabel: { fontSize: 15, color: "#f1f5f9", fontWeight: "800" },
  grandAmount: { fontSize: 22, fontWeight: "900", color: "#00f5ff", fontFamily: "monospace" },
  returnCard: { backgroundColor: "rgba(20,30,50,0.9)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 14, padding: 24 },
  returnHeader: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 },
  returnTitle: { fontSize: 18, fontWeight: "800", color: "#f87171", margin: "0 0 4px" },
  returnSubtitle: { fontSize: 12, color: "#64748b", margin: 0 },
  returnPreview: { display: "flex", alignItems: "center", gap: 8, backgroundColor: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.2)", borderRadius: 10, padding: "8px 16px" },
  returnPreviewLabel: { fontSize: 12, color: "#64748b" },
  returnPreviewAmount: { fontSize: 18, fontWeight: "900", color: "#4ade80", fontFamily: "monospace" },
  returnErrorBox: { backgroundColor: "rgba(239,68,68,0.1)", color: "#f87171", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 8, padding: "10px 14px", marginBottom: 16, fontSize: 13 },
  returnItemsList: { display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 },
  returnItem: { display: "flex", alignItems: "center", gap: 16, backgroundColor: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 10, padding: "14px 16px" },
  returnItemInfo: { flex: 1 },
  returnItemName: { fontSize: 14, fontWeight: "700", color: "#f1f5f9", margin: "0 0 3px" },
  returnItemMeta: { fontSize: 12, color: "#64748b", margin: 0 },
  returnQtyBox: { display: "flex", flexDirection: "column", alignItems: "center", gap: 4 },
  returnQtyLabel: { fontSize: 10, color: "#4a5568", textTransform: "uppercase", letterSpacing: 0.5 },
  returnQtyControls: { display: "flex", alignItems: "center", gap: 6 },
  returnQtyBtn: { width: 28, height: 28, borderRadius: 6, border: "1px solid rgba(255,255,255,0.1)", backgroundColor: "rgba(255,255,255,0.06)", color: "#fff", cursor: "pointer", fontSize: 16, fontWeight: "bold", display: "flex", alignItems: "center", justifyContent: "center" },
  returnQtyInput: { width: 48, textAlign: "center", padding: "4px", borderRadius: 6, border: "1px solid rgba(255,255,255,0.1)", backgroundColor: "rgba(255,255,255,0.05)", color: "#fff", fontSize: 14, fontWeight: "700", outline: "none" },
  returnMaxNote: { fontSize: 10, color: "#2d3748" },
  returnItemCalc: { textAlign: "right", minWidth: 80 },
  returnItemCalcLabel: { fontSize: 10, color: "#4a5568", margin: "0 0 2px", textTransform: "uppercase" },
  returnItemCalcValue: { fontSize: 15, fontWeight: "800", color: "#4ade80", margin: 0, fontFamily: "monospace" },
  processReturnBtn: { width: "100%", padding: "14px 0", backgroundColor: "rgba(239,68,68,0.2)", color: "#f87171", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 12, fontSize: 15, fontWeight: "800", transition: "all 0.2s", cursor: "pointer" },
};