import { useState } from "react";
import { formatMoney, calcChange } from "../../utils/money";

export default function CheckoutModal({ total, onConfirm, onClose }) {
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [amountPaid, setAmountPaid] = useState("");
  const [cashAmount, setCashAmount] = useState("");
  const [cardAmount, setCardAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const change = calcChange(Number(amountPaid), total);
  const splitTotal = Number(cashAmount || 0) + Number(cardAmount || 0);
  const splitRemaining = total - splitTotal;

  const handleConfirm = async () => {
    setError("");
    if (paymentMethod === "cash" && (!amountPaid || Number(amountPaid) < total)) {
      setError("Amount paid is less than total!"); return;
    }
    if (paymentMethod === "split" && splitTotal < total) {
      setError(`Still Rs ${splitRemaining.toLocaleString()} remaining!`); return;
    }
    try {
      setLoading(true);
      await onConfirm({
        paymentMethod: paymentMethod === "split" ? "cash" : paymentMethod,
        cashAmount: paymentMethod === "cash" ? Number(amountPaid) : paymentMethod === "split" ? Number(cashAmount) : total,
        cardAmount: paymentMethod === "split" ? Number(cardAmount) : 0,
        amountPaid: paymentMethod === "cash" ? Number(amountPaid) : total,
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const methods = [
    { value: "cash", label: "💵 Cash", color: "#22c55e" },
    { value: "card", label: "💳 Card", color: "#60a5fa" },
    { value: "online", label: "📱 Online", color: "#a78bfa" },
    { value: "split", label: "⚡ Split", color: "#f59e0b" },
  ];

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        {/* Header */}
        <div style={styles.header}>
          <h2 style={styles.title}>Checkout</h2>
          <button onClick={onClose} style={styles.xBtn}>✕</button>
        </div>

        {/* Total */}
        <div style={styles.totalBox}>
          <span style={styles.totalLabel}>Total Amount</span>
          <span style={styles.totalAmount}>{formatMoney(total)}</span>
        </div>

        {/* Payment Method Tabs */}
        <div style={styles.methodTabs}>
          {methods.map((m) => (
            <button
              key={m.value}
              onClick={() => setPaymentMethod(m.value)}
              style={{
                ...styles.methodTab,
                backgroundColor: paymentMethod === m.value ? `${m.color}22` : "rgba(255,255,255,0.03)",
                borderColor: paymentMethod === m.value ? m.color : "rgba(255,255,255,0.08)",
                color: paymentMethod === m.value ? m.color : "#4a5568",
              }}
            >
              {m.label}
            </button>
          ))}
        </div>

        {/* Cash */}
        {paymentMethod === "cash" && (
          <div style={styles.field}>
            <label style={styles.label}>Amount Received (Rs)</label>
            <input
              type="number" placeholder="Enter amount..."
              value={amountPaid} onChange={(e) => setAmountPaid(e.target.value)}
              style={styles.input} autoFocus
            />
          </div>
        )}

        {/* Card / Online */}
        {(paymentMethod === "card" || paymentMethod === "online") && (
          <div style={styles.infoBox}>
            <p style={styles.infoText}>
              {paymentMethod === "card" ? "💳 Card payment of" : "📱 Online transfer of"} <strong>{formatMoney(total)}</strong> will be recorded.
            </p>
          </div>
        )}

        {/* Split Payment */}
        {paymentMethod === "split" && (
          <div style={styles.splitBox}>
            <div style={styles.field}>
              <label style={styles.label}>💵 Cash Amount (Rs)</label>
              <input
                type="number" placeholder="Cash portion..."
                value={cashAmount} onChange={(e) => setCashAmount(e.target.value)}
                style={styles.input}
              />
            </div>
            <div style={styles.field}>
              <label style={styles.label}>💳 Card Amount (Rs)</label>
              <input
                type="number" placeholder="Card portion..."
                value={cardAmount} onChange={(e) => setCardAmount(e.target.value)}
                style={styles.input}
              />
            </div>
            <div style={{
              ...styles.splitStatus,
              color: splitRemaining <= 0 ? "#22c55e" : "#f59e0b",
              borderColor: splitRemaining <= 0 ? "#22c55e44" : "#f59e0b44",
              backgroundColor: splitRemaining <= 0 ? "#22c55e11" : "#f59e0b11",
            }}>
              {splitRemaining <= 0 ? "✅ Fully covered" : `⚡ Rs ${splitRemaining.toLocaleString()} remaining`}
            </div>
          </div>
        )}

        {/* Change */}
        {paymentMethod === "cash" && amountPaid && Number(amountPaid) >= total && (
          <div style={styles.changeBox}>
            <span>Change to Return</span>
            <span style={styles.changeAmount}>{formatMoney(change)}</span>
          </div>
        )}

        {error && <p style={styles.error}>⚠️ {error}</p>}

        <div style={styles.btnRow}>
          <button onClick={onClose} style={styles.cancelBtn}>Cancel</button>
          <button onClick={handleConfirm} disabled={loading} style={styles.confirmBtn}>
            {loading ? "Processing..." : "✅ Confirm Sale"}
          </button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  overlay: { position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 999, backdropFilter: "blur(4px)" },
  modal: {
    background: "rgba(15,23,42,0.95)", borderRadius: 18,
    padding: 28, width: 420,
    border: "1px solid rgba(255,255,255,0.08)",
    display: "flex", flexDirection: "column", gap: 16,
    boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
  },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  title: { fontSize: 20, fontWeight: "bold", color: "#f1f5f9", margin: 0 },
  xBtn: { background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "50%", width: 32, height: 32, cursor: "pointer", color: "#94a3b8", fontSize: 14 },
  totalBox: { background: "rgba(0,245,255,0.06)", border: "1px solid rgba(0,245,255,0.15)", borderRadius: 12, padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" },
  totalLabel: { fontSize: 13, color: "#4a5568" },
  totalAmount: { fontSize: 26, fontWeight: "800", color: "#00f5ff", fontFamily: "monospace", textShadow: "0 0 20px rgba(0,245,255,0.4)" },
  methodTabs: { display: "flex", gap: 8 },
  methodTab: { flex: 1, padding: "10px 4px", borderRadius: 10, border: "1px solid", cursor: "pointer", fontSize: 12, fontWeight: "700", transition: "all 0.2s" },
  field: { display: "flex", flexDirection: "column", gap: 6 },
  label: { fontSize: 12, color: "#4a5568", fontWeight: "600" },
  input: { padding: "11px 14px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.05)", color: "#f1f5f9", fontSize: 15, outline: "none" },
  infoBox: { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 10, padding: "14px 16px" },
  infoText: { color: "#4a5568", fontSize: 13, margin: 0 },
  splitBox: { display: "flex", flexDirection: "column", gap: 10 },
  splitStatus: { padding: "10px 14px", borderRadius: 10, border: "1px solid", fontSize: 13, fontWeight: "600", textAlign: "center" },
  changeBox: { background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.2)", borderRadius: 10, padding: "12px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" },
  changeAmount: { fontSize: 20, fontWeight: "bold", color: "#22c55e" },
  error: { color: "#f87171", fontSize: 13, backgroundColor: "rgba(239,68,68,0.1)", padding: "10px 14px", borderRadius: 8, margin: 0 },
  btnRow: { display: "flex", gap: 10 },
  cancelBtn: { flex: 1, padding: "12px 0", background: "rgba(255,255,255,0.05)", color: "#4a5568", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, cursor: "pointer", fontSize: 14 },
  confirmBtn: { flex: 2, padding: "12px 0", background: "linear-gradient(135deg, #22c55e, #16a34a)", color: "#fff", border: "none", borderRadius: 10, cursor: "pointer", fontSize: 14, fontWeight: "bold", boxShadow: "0 4px 16px rgba(34,197,94,0.3)" },
};  