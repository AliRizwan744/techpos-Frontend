import { useState } from "react";
import { formatMoney, calcTotal, calcTax, applyDiscount } from "../../utils/money";

export default function Cart({
  items, discount, taxPercent,
  onIncrease, onDecrease, onRemove, onCheckout, onDiscountChange,
}) {
  const subtotal = items.reduce((sum, i) => sum + i.price * i.qty, 0);
  const afterDiscount = applyDiscount(subtotal, discount);
  const taxAmount = calcTax(afterDiscount, taxPercent);
  const total = calcTotal(subtotal, discount, taxPercent);

  return (
    <div style={styles.wrapper}>
      {/* Header */}
      <div style={styles.header}>
        <h3 style={styles.title}>🛒 Cart</h3>
        <span style={styles.badge}>{items.reduce((s, i) => s + i.qty, 0)} items</span>
      </div>

      {/* Items */}
      <div style={styles.itemsList}>
        {items.length === 0 && (
          <div style={styles.emptyBox}>
            <p style={styles.emptyIcon}>🛍</p>
            <p style={styles.empty}>Cart is empty</p>
            <p style={styles.emptySub}>Add products to get started</p>
          </div>
        )}
        {items.map((item) => (
          <div key={item._id} style={styles.item}>
            <div style={styles.itemTop}>
              <p style={styles.itemName}>{item.name}</p>
              <button onClick={() => onRemove(item._id)} style={styles.removeBtn}>✕</button>
            </div>
            <div style={styles.itemBottom}>
              <div style={styles.qtyControls}>
                <button onClick={() => onDecrease(item._id)} style={styles.qtyBtn}>−</button>
                <span style={styles.qty}>{item.qty}</span>
                <button onClick={() => onIncrease(item._id)} style={styles.qtyBtn}>+</button>
              </div>
              <p style={styles.lineTotal}>Rs {(item.price * item.qty).toLocaleString()}</p>
            </div>
            <p style={styles.unitPrice}>Rs {item.price?.toLocaleString()} / each</p>
          </div>
        ))}
      </div>

      {/* Discount */}
      <div style={styles.discountRow}>
        <label style={styles.label}>🏷 Discount (Rs)</label>
        <input
          type="number" min={0} value={discount}
          onChange={(e) => onDiscountChange(Number(e.target.value))}
          style={styles.discountInput}
        />
      </div>

      {/* Totals */}
      <div style={styles.totals}>
        <div style={styles.totalRow}>
          <span style={styles.totalLabel}>Subtotal</span>
          <span style={styles.totalValue}>{formatMoney(subtotal)}</span>
        </div>
        {discount > 0 && (
          <div style={styles.totalRow}>
            <span style={styles.totalLabel}>Discount</span>
            <span style={{ ...styles.totalValue, color: "#4ade80" }}>− {formatMoney(discount)}</span>
          </div>
        )}
        {taxPercent > 0 && (
          <div style={styles.totalRow}>
            <span style={styles.totalLabel}>Tax ({taxPercent}%)</span>
            <span style={styles.totalValue}>{formatMoney(taxAmount)}</span>
          </div>
        )}
        <div style={styles.grandRow}>
          <span style={styles.grandLabel}>TOTAL</span>
          <span style={styles.grandAmount}>{formatMoney(total)}</span>
        </div>
      </div>

      {/* Checkout */}
      <button
        onClick={onCheckout}
        disabled={items.length === 0}
        style={{
          ...styles.checkoutBtn,
          opacity: items.length === 0 ? 0.4 : 1,
          cursor: items.length === 0 ? "not-allowed" : "pointer",
        }}
      >
        Proceed to Checkout →
        <span style={styles.enterHint}>Enter ↵</span>
      </button>
    </div>
  );
}

const styles = {
  wrapper: {
    display: "flex", flexDirection: "column", gap: 12,
    marginTop: 44, paddingBottom: 20,
  },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  title: { fontSize: 17, fontWeight: "bold", color: "#ffffff", margin: 0 },
  badge: {
    fontSize: 11, color: "#93c5fd",
    backgroundColor: "rgba(59,130,246,0.2)",
    padding: "3px 10px", borderRadius: 12,
    border: "1px solid rgba(59,130,246,0.3)",
  },
  itemsList: { display: "flex", flexDirection: "column", gap: 8 },
  emptyBox: { textAlign: "center", padding: "30px 0" },
  emptyIcon: { fontSize: 36, marginBottom: 8 },
  empty: { color: "#cbd5e1", fontSize: 14, fontWeight: "600" },
  emptySub: { color: "#64748b", fontSize: 12, marginTop: 4 },

  // ✅ Item card — solid dark bg, clearly visible
  item: {
    backgroundColor: "rgba(30,41,59,0.9)",
    border: "1px solid rgba(100,116,139,0.4)",
    borderRadius: 10, padding: "12px 14px",
    display: "flex", flexDirection: "column", gap: 8,
  },
  itemTop: { display: "flex", justifyContent: "space-between", alignItems: "flex-start" },
  itemName: { fontWeight: "700", fontSize: 14, color: "#ffffff", margin: 0, flex: 1, lineHeight: 1.3 },
  removeBtn: {
    background: "rgba(239,68,68,0.15)",
    border: "1px solid rgba(239,68,68,0.3)",
    borderRadius: 6, color: "#fca5a5",
    cursor: "pointer", fontSize: 11,
    padding: "3px 8px", fontWeight: "bold",
  },
  itemBottom: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  qtyControls: { display: "flex", alignItems: "center", gap: 8 },
  qtyBtn: {
    width: 30, height: 30, borderRadius: 8,
    border: "1px solid rgba(148,163,184,0.3)",
    backgroundColor: "rgba(51,65,85,0.8)",
    cursor: "pointer", fontSize: 18,
    fontWeight: "bold", color: "#ffffff",
    display: "flex", alignItems: "center", justifyContent: "center",
  },
  qty: {
    minWidth: 32, textAlign: "center",
    fontWeight: "800", color: "#ffffff",
    fontSize: 16, fontFamily: "monospace",
  },
  lineTotal: {
    fontWeight: "800", color: "#7dd3fc",
    fontSize: 15, margin: 0,
  },
  unitPrice: { fontSize: 11, color: "#64748b", margin: 0 },

  // Discount
  discountRow: {
    display: "flex", alignItems: "center", gap: 10,
    padding: "10px 0",
    borderTop: "1px solid rgba(100,116,139,0.3)",
  },
  label: { fontSize: 12, color: "#cbd5e1", whiteSpace: "nowrap", fontWeight: "600" },
  discountInput: {
    flex: 1, padding: "8px 12px", borderRadius: 8,
    border: "1px solid rgba(100,116,139,0.4)",
    background: "rgba(30,41,59,0.8)",
    color: "#ffffff", fontSize: 14, outline: "none",
  },

  // Totals
  totals: {
    borderTop: "1px solid rgba(100,116,139,0.3)",
    paddingTop: 12,
    display: "flex", flexDirection: "column", gap: 8,
  },
  totalRow: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  totalLabel: { fontSize: 13, color: "#94a3b8" },
  totalValue: { fontSize: 13, color: "#e2e8f0", fontWeight: "600" },
  grandRow: {
    display: "flex", justifyContent: "space-between", alignItems: "center",
    marginTop: 4, paddingTop: 10,
    borderTop: "1px solid rgba(100,116,139,0.3)",
  },
  grandLabel: { fontSize: 14, color: "#ffffff", fontWeight: "800", letterSpacing: 1 },
  grandAmount: {
    fontSize: 24, fontWeight: "900",
    color: "#00f5ff",
    textShadow: "0 0 20px rgba(0,245,255,0.5)",
    fontFamily: "monospace",
  },

  // Checkout button
  checkoutBtn: {
    padding: "14px 0",
    background: "linear-gradient(135deg, #2563eb, #1d4ed8)",
    color: "#ffffff", border: "none", borderRadius: 12,
    fontSize: 15, fontWeight: "800",
    boxShadow: "0 4px 20px rgba(37,99,235,0.5)",
    display: "flex", alignItems: "center",
    justifyContent: "center", gap: 8,
    letterSpacing: 0.5,
  },
  enterHint: {
    fontSize: 10, opacity: 0.7,
    backgroundColor: "rgba(255,255,255,0.15)",
    padding: "2px 7px", borderRadius: 4,
    fontFamily: "monospace",
  },
};