import { useState, useEffect, useCallback, useRef } from "react";
import http from "../api/http";
import { useNavigate } from "react-router-dom";
import { calcTotal } from "../utils/money";
import ProductList from "../components/pos/ProductList";
import Cart from "../components/pos/Cart";
import CheckoutModal from "../components/pos/CheckoutModal";

// ✅ Sound effect
const playAddSound = () => {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.connect(g); g.connect(ctx.destination);
    o.frequency.setValueAtTime(520, ctx.currentTime);
    o.frequency.setValueAtTime(780, ctx.currentTime + 0.1);
    g.gain.setValueAtTime(0.3, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
    o.start(ctx.currentTime);
    o.stop(ctx.currentTime + 0.3);
  } catch { }
};

export default function POS() {
  const [cartItems, setCartItems] = useState([]);
  const [discount, setDiscount] = useState(0);
  const [taxPercent, setTaxPercent] = useState(0);
  const [showCheckout, setShowCheckout] = useState(false);
  const [showCart, setShowCart] = useState(false);
  const [recentlyAdded, setRecentlyAdded] = useState([]);
  const [animatingId, setAnimatingId] = useState(null);
  const [showScanner, setShowScanner] = useState(false);
  const [barcodeInput, setBarcodeInput] = useState("");
  const barcodeRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchStore = async () => {
      try {
        const res = await http.get("/store");
        setTaxPercent((res.data || res).taxPercent || 0);
      } catch { }
    };
    fetchStore();
  }, []);

  // ✅ Keyboard shortcuts
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === "Escape") { setShowCart(false); setShowCheckout(false); setShowScanner(false); }
      if (e.key === "Enter" && showCart && cartItems.length > 0) { setShowCart(false); setShowCheckout(true); }
      if (e.key === "F2") { setShowCart(true); }
      if (e.key === "F3") { setShowScanner(true); setTimeout(() => barcodeRef.current?.focus(), 100); }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [showCart, cartItems]);

  const handleAdd = (product) => {
    playAddSound();
    setAnimatingId(product._id);
    setTimeout(() => setAnimatingId(null), 400);
    setCartItems((prev) => {
      const exists = prev.find((i) => i._id === product._id);
      if (exists) return prev.map((i) => i._id === product._id ? { ...i, qty: i.qty + 1 } : i);
      return [...prev, { ...product, qty: 1 }];
    });
    // Recently added
    setRecentlyAdded((prev) => {
      const filtered = prev.filter((p) => p._id !== product._id);
      return [product, ...filtered].slice(0, 5);
    });
    setShowCart(true);
  };

  // ✅ Barcode search
  const handleBarcodeSearch = async () => {
    if (!barcodeInput.trim()) return;
    try {
      const res = await http.get(`/products?q=${barcodeInput}&active=true`);
      const products = res.data || res || [];
      if (products.length > 0) { handleAdd(products[0]); setBarcodeInput(""); }
    } catch { }
  };

  const handleIncrease = (id) => setCartItems((prev) => prev.map((i) => i._id === id ? { ...i, qty: i.qty + 1 } : i));
  const handleDecrease = (id) => setCartItems((prev) => prev.map((i) => i._id === id ? { ...i, qty: i.qty - 1 } : i).filter((i) => i.qty > 0));
  const handleRemove = (id) => setCartItems((prev) => prev.filter((i) => i._id !== id));

  const handleConfirmSale = async ({ paymentMethod, cashAmount, cardAmount }) => {
    const items = cartItems.map((i) => ({ productId: i._id, qty: i.qty }));
    const res = await http.post("/sales", { items, discount, paymentMethod, amountPaid: cashAmount || cardAmount || total });
    const saleId = res.saleId || res.data?.saleId || res._id || res.data?._id;
    setCartItems([]); setDiscount(0); setShowCheckout(false); setShowCart(false); setRecentlyAdded([]);
    navigate(`/receipt/${saleId}`);
  };

  const subtotal = cartItems.reduce((sum, i) => sum + i.price * i.qty, 0);
  const total = calcTotal(subtotal, discount, taxPercent);
  const cartCount = cartItems.reduce((sum, i) => sum + i.qty, 0);

  return (
    <div style={styles.page}>
      {/* ✅ Keyboard shortcuts hint */}
      <div style={styles.shortcuts}>
        <span>F2 Cart</span>
        <span>F3 Scanner</span>
        <span>Enter Checkout</span>
        <span>Esc Close</span>
      </div>

      {/* ✅ Barcode Scanner Bar */}
      {showScanner && (
        <div style={styles.scannerBar}>
          <span style={styles.scannerIcon}>📷</span>
          <input
            ref={barcodeRef}
            placeholder="Scan barcode or type product name..."
            value={barcodeInput}
            onChange={(e) => setBarcodeInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleBarcodeSearch()}
            style={styles.scannerInput}
            autoFocus
          />
          <button onClick={handleBarcodeSearch} style={styles.scanBtn}>Search</button>
          <button onClick={() => setShowScanner(false)} style={styles.scanClose}>✕</button>
        </div>
      )}

      {/* ✅ Recently Added */}
      {recentlyAdded.length > 0 && (
        <div style={styles.recentBar}>
          <span style={styles.recentLabel}>Recently Added:</span>
          {recentlyAdded.map((p) => (
            <button key={p._id} onClick={() => handleAdd(p)} style={styles.recentChip}>
              {p.name} <span style={styles.recentPrice}>Rs {p.price?.toLocaleString()}</span>
            </button>
          ))}
        </div>
      )}

      <ProductList onAdd={handleAdd} animatingId={animatingId} />

      {/* ✅ Floating Cart Button */}
      <button onClick={() => setShowCart(true)} style={{
        ...styles.floatingCart,
        transform: cartCount > 0 ? "scale(1.05)" : "scale(1)",
      }}>
        🛍
        {cartCount > 0 && <span style={styles.floatingBadge}>{cartCount}</span>}
      </button>

      {/* Cart Panel */}
      {showCart && (
        <>
          <div onClick={() => setShowCart(false)} style={styles.backdrop} />
          <div style={styles.cartPanel}>
            <button onClick={() => setShowCart(false)} style={styles.closeBtn}>✕</button>
            <Cart
              items={cartItems}
              discount={discount}
              taxPercent={taxPercent}
              onIncrease={handleIncrease}
              onDecrease={handleDecrease}
              onRemove={handleRemove}
              onCheckout={() => { setShowCart(false); setShowCheckout(true); }}
              onDiscountChange={setDiscount}
            />
          </div>
        </>
      )}

      {showCheckout && (
        <CheckoutModal
          total={total}
          onConfirm={handleConfirmSale}
          onClose={() => setShowCheckout(false)}
        />
      )}

      <style>{`
        @keyframes cartBounce {
          0% { transform: scale(1); }
          40% { transform: scale(1.15); }
          70% { transform: scale(0.95); }
          100% { transform: scale(1); }
        }
        .add-animate { animation: cartBounce 0.4s ease; }
      `}</style>
    </div>
  );
}

const styles = {
  page: { minHeight: "100vh", padding: "0 8px" },
  shortcuts: {
    display: "flex", gap: 12, padding: "6px 4px", marginBottom: 4,
    flexWrap: "wrap",
  },
  scannerBar: {
    display: "flex", alignItems: "center", gap: 8,
    backgroundColor: "rgba(0,245,255,0.08)",
    border: "1px solid rgba(0,245,255,0.2)",
    borderRadius: 10, padding: "8px 12px", marginBottom: 12,
  },
  scannerIcon: { fontSize: 18 },
  scannerInput: {
    flex: 1, padding: "8px 12px", borderRadius: 8,
    border: "1px solid rgba(0,245,255,0.3)",
    background: "rgba(0,0,0,0.3)", color: "#fff", fontSize: 14,
    outline: "none",
  },
  scanBtn: {
    padding: "8px 16px", backgroundColor: "rgba(0,245,255,0.2)",
    color: "#00f5ff", border: "1px solid rgba(0,245,255,0.3)",
    borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: "bold",
  },
  scanClose: {
    padding: "8px 12px", backgroundColor: "transparent",
    color: "#888", border: "none", borderRadius: 8, cursor: "pointer", fontSize: 16,
  },
  recentBar: {
    display: "flex", alignItems: "center", gap: 8,
    padding: "8px 4px", marginBottom: 8, flexWrap: "wrap",
  },
  recentLabel: { fontSize: 11, color: "#4a5568", fontWeight: "600", letterSpacing: 1 },
  recentChip: {
    padding: "5px 12px", borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.1)",
    color: "#e2e8f0", fontSize: 12, cursor: "pointer",
    display: "flex", alignItems: "center", gap: 6,
  },
  recentPrice: { color: "#00f5ff", fontSize: 11 },
  floatingCart: {
    position: "fixed", bottom: 28, right: 28,
    width: 64, height: 64, borderRadius: "50%",
    background: "linear-gradient(135deg, #1976d2, #0d47a1)",
    color: "#fff", border: "none", fontSize: 26, cursor: "pointer",
    boxShadow: "0 4px 20px rgba(25,118,210,0.5), 0 0 0 0 rgba(25,118,210,0.4)",
    zIndex: 150,
    display: "flex", alignItems: "center", justifyContent: "center",
    transition: "transform 0.2s",
  },
  floatingBadge: {
    position: "absolute", top: 2, right: 2,
    backgroundColor: "#ef4444", color: "#fff",
    borderRadius: "50%", width: 22, height: 22,
    fontSize: 11, fontWeight: "bold",
    display: "flex", alignItems: "center", justifyContent: "center",
    boxShadow: "0 0 8px rgba(239,68,68,0.6)",
  },
  backdrop: { position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.5)", zIndex: 200, backdropFilter: "blur(4px)" },
  cartPanel: {
    position: "fixed", top: 0, right: 0,
    width: 400, height: "100vh",
    zIndex: 201, overflowY: "auto", padding: 16,
    background: "rgba(15,23,42,0.85)",
    backdropFilter: "blur(24px)",
    WebkitBackdropFilter: "blur(24px)",
    borderLeft: "1px solid rgba(255,255,255,0.08)",
    boxShadow: "-8px 0 40px rgba(0,0,0,0.4)",
  },
  closeBtn: {
    position: "absolute", top: 12, right: 12,
    background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: "50%", width: 34, height: 34,
    cursor: "pointer", fontSize: 16, color: "#94a3b8",
    display: "flex", alignItems: "center", justifyContent: "center",
  },
};