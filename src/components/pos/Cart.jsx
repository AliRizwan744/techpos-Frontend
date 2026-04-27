import { useState } from "react";
import { formatMoney, calcTotal, calcTax, applyDiscount } from "../../utils/money";

export default function Cart({
  items, discount, taxPercent,
  onIncrease, onDecrease, onRemove, onCheckout, onDiscountChange,
  cartCount, total,
}) {
  const subtotal = items.reduce((sum, i) => sum + i.price * i.qty, 0);
  const afterDiscount = applyDiscount(subtotal, discount);
  const taxAmount = calcTax(afterDiscount, taxPercent);
  const grandTotal = calcTotal(subtotal, discount, taxPercent);
  const [discountType, setDiscountType] = useState("flat");
  const [note, setNote] = useState("");

  const handleDiscountInput = (val) => {
    if (discountType === "percent") {
      const pct = Math.min(100, Math.max(0, Number(val)));
      onDiscountChange(Math.round(subtotal * pct / 100));
    } else {
      onDiscountChange(Math.min(subtotal, Math.max(0, Number(val))));
    }
  };

  const discountDisplayVal = discountType === "percent"
    ? subtotal > 0 ? Math.round((discount / subtotal) * 100) : 0
    : discount;

  return (
    <div style={styles.wrapper}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <span style={styles.headerIcon}>🛒</span>
          <span style={styles.headerTitle}>Cart</span>
          <span style={styles.shortcutHint}>Enter=Checkout Del=Remove +/-=Qty</span>
        </div>
        <div style={styles.headerRight}>
          {cartCount > 0 && <span style={styles.countBadge}>{cartCount}</span>}
          {items.length > 0 && (
            <button
              onClick={() => items.forEach(i => onRemove(i._id))}
              style={styles.clearAllBtn}
            >🗑</button>
          )}
        </div>
      </div>

      {/* Items */}
      <div style={styles.itemsList}>
        {items.length === 0 ? (
          <div style={styles.emptyBox}>
            <div style={styles.emptyIconWrapper}>🛍</div>
            <p style={styles.emptyText}>Cart is empty</p>
            <p style={styles.emptySub}>Search products or press F4</p>
          </div>
        ) : (
          items.map((item, idx) => (
            <div key={item._id} style={{ ...styles.item, borderColor: idx === items.length - 1 ? "rgba(59,130,246,0.3)" : "rgba(255,255,255,0.06)" }}>
              <div style={styles.itemTop}>
                <div style={styles.itemNameWrapper}>
                  <span style={styles.itemName}>{item.name}</span>
                  {item.type === "service" && <span style={styles.serviceBadge}>Service</span>}
                  {idx === items.length - 1 && <span style={styles.lastItemBadge}>+/- keys</span>}
                </div>
                <button onClick={() => onRemove(item._id)} style={styles.removeBtn}>✕</button>
              </div>
              <div style={styles.itemBottom}>
                <div style={styles.qtyControls}>
                  <button onClick={() => onDecrease(item._id)} style={styles.qtyBtn}>−</button>
                  <span style={styles.qty}>{item.qty}</span>
                  <button onClick={() => onIncrease(item._id)} style={styles.qtyBtn}>+</button>
                </div>
                <div style={styles.itemPriceBox}>
                  <span style={styles.unitPrice}>Rs {item.price?.toLocaleString()} each</span>
                  <span style={styles.lineTotal}>Rs {(item.price * item.qty).toLocaleString()}</span>
                </div>
              </div>
              {item.type === "product" && item.stockQty !== undefined && (
                <div style={styles.stockBar}>
                  <div style={{
                    ...styles.stockFill,
                    width: `${Math.min(100, (item.qty / item.stockQty) * 100)}%`,
                    backgroundColor: item.qty >= item.stockQty ? "#ef4444" : item.qty >= item.stockQty * 0.7 ? "#f59e0b" : "#22c55e",
                  }} />
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Discount */}
      {items.length > 0 && (
        <div style={styles.discountSection}>
          <div style={styles.discountHeader}>
            <span style={styles.discountLabel}>🏷 Discount</span>
            <div style={styles.discountTypeTabs}>
              <button onClick={() => setDiscountType("flat")} style={{ ...styles.discountTab, ...(discountType === "flat" ? styles.discountTabActive : {}) }}>Rs</button>
              <button onClick={() => setDiscountType("percent")} style={{ ...styles.discountTab, ...(discountType === "percent" ? styles.discountTabActive : {}) }}>%</button>
            </div>
          </div>
          <div style={styles.discountInputRow}>
            <input
              type="number"
              min={0}
              max={discountType === "percent" ? 100 : subtotal}
              value={discountDisplayVal}
              onChange={(e) => handleDiscountInput(e.target.value)}
              // ✅ Focus pe zero clear ho jaye
              onFocus={(e) => e.target.select()}
              style={styles.discountInput}
            />
            <span style={styles.discountSuffix}>{discountType === "percent" ? "%" : "Rs"}</span>
          </div>
          {discount > 0 && <p style={styles.discountSaved}>💚 Saving Rs {discount.toLocaleString()}</p>}
        </div>
      )}

      {/* Note */}
      {items.length > 0 && (
        <div style={styles.noteSection}>
          <input
            placeholder="📝 Note (optional)..."
            value={note}
            onChange={(e) => setNote(e.target.value)}
            style={styles.noteInput}
          />
        </div>
      )}

      {/* Totals */}
      {items.length > 0 && (
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
            <span style={styles.grandAmount}>{formatMoney(grandTotal)}</span>
          </div>
        </div>
      )}

      {/* Checkout */}
      <div style={styles.checkoutSection}>
        <button
          onClick={onCheckout}
          disabled={items.length === 0}
          style={{ ...styles.checkoutBtn, opacity: items.length === 0 ? 0.3 : 1, cursor: items.length === 0 ? "not-allowed" : "pointer" }}
        >
          <span>Checkout</span>
          <span style={styles.checkoutBadge}>F1 / Enter</span>
          <span style={styles.checkoutArrow}>→</span>
        </button>
      </div>
    </div>
  );
}

const styles = {
  wrapper: { display: "flex", flexDirection: "column", height: "100%", overflow: "hidden", backgroundColor: "rgba(8,12,24,0.98)" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 14px 10px", borderBottom: "1px solid rgba(255,255,255,0.05)", flexShrink: 0 },
  headerLeft: { display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" },
  headerIcon: { fontSize: 16 },
  headerTitle: { fontSize: 15, fontWeight: "800", color: "#f1f5f9" },
  shortcutHint: { fontSize: 8, color: "#1e293b", fontFamily: "monospace" },
  headerRight: { display: "flex", alignItems: "center", gap: 6 },
  countBadge: { backgroundColor: "#2563eb", color: "#fff", borderRadius: "50%", width: 20, height: 20, fontSize: 10, fontWeight: "800", display: "flex", alignItems: "center", justifyContent: "center" },
  clearAllBtn: { fontSize: 13, color: "#334155", background: "none", border: "none", cursor: "pointer", padding: "2px 5px" },
  itemsList: { flex: 1, overflowY: "auto", padding: "8px 10px", display: "flex", flexDirection: "column", gap: 6 },
  emptyBox: { textAlign: "center", padding: "40px 0" },
  emptyIconWrapper: { fontSize: 36, marginBottom: 8 },
  emptyText: { color: "#1e293b", fontSize: 13, fontWeight: "700", margin: "0 0 3px" },
  emptySub: { color: "#0f172a", fontSize: 11, margin: 0 },
  item: { backgroundColor: "rgba(15,23,42,0.9)", border: "1px solid", borderRadius: 9, padding: "9px 11px", display: "flex", flexDirection: "column", gap: 6 },
  itemTop: { display: "flex", justifyContent: "space-between", alignItems: "flex-start" },
  itemNameWrapper: { flex: 1, display: "flex", alignItems: "center", gap: 5, flexWrap: "wrap" },
  itemName: { fontSize: 12, fontWeight: "700", color: "#f1f5f9", lineHeight: 1.3 },
  serviceBadge: { fontSize: 8, color: "#a78bfa", backgroundColor: "rgba(167,139,250,0.1)", padding: "1px 5px", borderRadius: 3 },
  lastItemBadge: { fontSize: 8, color: "#3b82f6", backgroundColor: "rgba(59,130,246,0.1)", padding: "1px 5px", borderRadius: 3, border: "1px solid rgba(59,130,246,0.2)" },
  removeBtn: { background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.15)", borderRadius: 4, color: "#f87171", cursor: "pointer", fontSize: 9, padding: "2px 6px", fontWeight: "700" },
  itemBottom: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  qtyControls: { display: "flex", alignItems: "center", gap: 5 },
  qtyBtn: { width: 24, height: 24, borderRadius: 5, border: "1px solid rgba(255,255,255,0.08)", backgroundColor: "rgba(30,41,59,0.9)", cursor: "pointer", fontSize: 14, fontWeight: "800", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center" },
  qty: { minWidth: 26, textAlign: "center", fontWeight: "900", color: "#fff", fontSize: 14, fontFamily: "monospace" },
  itemPriceBox: { display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 1 },
  unitPrice: { fontSize: 9, color: "#1e293b" },
  lineTotal: { fontSize: 13, fontWeight: "800", color: "#60a5fa", fontFamily: "monospace" },
  stockBar: { height: 2, backgroundColor: "rgba(255,255,255,0.04)", borderRadius: 2, overflow: "hidden" },
  stockFill: { height: "100%", borderRadius: 2, transition: "width 0.3s ease" },
  discountSection: { padding: "8px 12px", borderTop: "1px solid rgba(255,255,255,0.04)", flexShrink: 0 },
  discountHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 },
  discountLabel: { fontSize: 11, color: "#334155", fontWeight: "600" },
  discountTypeTabs: { display: "flex", gap: 3 },
  discountTab: { padding: "2px 9px", borderRadius: 5, border: "1px solid rgba(255,255,255,0.07)", background: "transparent", color: "#334155", cursor: "pointer", fontSize: 10, fontWeight: "700" },
  discountTabActive: { backgroundColor: "rgba(37,99,235,0.15)", color: "#60a5fa", borderColor: "rgba(37,99,235,0.3)" },
  discountInputRow: { display: "flex", alignItems: "center", gap: 5 },
  discountInput: { flex: 1, padding: "6px 9px", borderRadius: 7, border: "1px solid rgba(255,255,255,0.07)", backgroundColor: "rgba(15,23,42,0.8)", color: "#f1f5f9", fontSize: 13, outline: "none" },
  discountSuffix: { fontSize: 12, color: "#334155", fontWeight: "700", minWidth: 18 },
  discountSaved: { fontSize: 9, color: "#4ade80", margin: "3px 0 0", textAlign: "right" },
  noteSection: { padding: "0 12px 6px", flexShrink: 0 },
  noteInput: { width: "100%", padding: "6px 9px", borderRadius: 7, border: "1px solid rgba(255,255,255,0.05)", backgroundColor: "rgba(15,23,42,0.5)", color: "#475569", fontSize: 11, outline: "none", boxSizing: "border-box" },
  totals: { padding: "8px 12px", borderTop: "1px solid rgba(255,255,255,0.04)", display: "flex", flexDirection: "column", gap: 5, flexShrink: 0 },
  totalRow: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  totalLabel: { fontSize: 11, color: "#1e293b" },
  totalValue: { fontSize: 11, color: "#64748b", fontWeight: "600" },
  grandRow: { display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 6, borderTop: "1px solid rgba(255,255,255,0.05)" },
  grandLabel: { fontSize: 12, color: "#94a3b8", fontWeight: "800", letterSpacing: 1 },
  grandAmount: { fontSize: 20, fontWeight: "900", color: "#3b82f6", fontFamily: "monospace", textShadow: "0 0 16px rgba(59,130,246,0.4)" },
  checkoutSection: { padding: "8px 12px 14px", flexShrink: 0 },
  checkoutBtn: { width: "100%", padding: "12px 0", background: "linear-gradient(135deg, #1d4ed8, #2563eb)", color: "#fff", border: "none", borderRadius: 10, fontSize: 13, fontWeight: "800", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, boxShadow: "0 4px 16px rgba(37,99,235,0.3)", transition: "all 0.2s" },
  checkoutBadge: { fontSize: 9, backgroundColor: "rgba(255,255,255,0.15)", padding: "2px 7px", borderRadius: 4, fontFamily: "monospace" },
  checkoutArrow: { fontSize: 16 },
};
