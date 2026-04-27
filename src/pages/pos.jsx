import { useState, useEffect, useRef } from "react";
import http from "../api/http";
import { useNavigate } from "react-router-dom";
import { calcTotal } from "../utils/money";
import ProductList from "../components/pos/ProductList";
import Cart from "../components/pos/Cart";
import CheckoutModal from "../components/pos/CheckoutModal";

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
  const [recentlyAdded, setRecentlyAdded] = useState([]);
  const [animatingId, setAnimatingId] = useState(null);
  const [showScanner, setShowScanner] = useState(false);
  const [barcodeInput, setBarcodeInput] = useState("");
  const [stockError, setStockError] = useState("");
  const barcodeRef = useRef(null);
  const searchRef = useRef(null);
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

  useEffect(() => {
    setTimeout(() => searchRef.current?.focus(), 200);
  }, []);

useEffect(() => {
  const handleKey = (e) => {
    const tag = document.activeElement?.tagName?.toLowerCase();
    const isTyping = tag === "input" || tag === "textarea" || tag === "select";

    // ✅ Ctrl+Enter — Checkout
    if (e.key === "Enter" && e.ctrlKey) {
      e.preventDefault();
      if (cartItems.length > 0 && !showCheckout) setShowCheckout(true);
      return;
    }

    // ✅ Ctrl+N — New Sale
    if (e.key === "n" && e.ctrlKey) {
      e.preventDefault();
      if (cartItems.length > 0) {
        if (window.confirm("New sale? Cart clear ho jayega.")) {
          setCartItems([]); setDiscount(0); setRecentlyAdded([]);
        }
      }
      setTimeout(() => searchRef.current?.focus(), 100);
      return;
    }

    // ✅ Ctrl+F — Search focus
    if (e.key === "f" && e.ctrlKey) {
      e.preventDefault();
      searchRef.current?.focus();
      return;
    }

    // ✅ Ctrl+S — Scanner
    if (e.key === "s" && e.ctrlKey) {
      e.preventDefault();
      setShowScanner((p) => !p);
      setTimeout(() => barcodeRef.current?.focus(), 100);
      return;
    }

    // ✅ Enter — Checkout (not typing)
    if (e.key === "Enter" && !isTyping && cartItems.length > 0 && !showCheckout) {
      e.preventDefault();
      setShowCheckout(true);
      return;
    }

    // ✅ Escape
    if (e.key === "Escape") {
      setShowCheckout(false);
      setShowScanner(false);
      setTimeout(() => searchRef.current?.focus(), 100);
      return;
    }

    // ✅ Delete — last item remove
    if (e.key === "Delete" && !isTyping && cartItems.length > 0) {
      e.preventDefault();
      const last = cartItems[cartItems.length - 1];
      setCartItems((prev) => prev.filter((i) => i._id !== last._id));
      return;
    }

    // ✅ + — last item increase
    if (e.key === "+" && !isTyping && cartItems.length > 0) {
      e.preventDefault();
      handleIncrease(cartItems[cartItems.length - 1]._id);
      return;
    }

    // ✅ - — last item decrease
    if (e.key === "-" && !isTyping && cartItems.length > 0) {
      e.preventDefault();
      handleDecrease(cartItems[cartItems.length - 1]._id);
      return;
    }
  };

  window.addEventListener("keydown", handleKey);
  return () => window.removeEventListener("keydown", handleKey);
}, [cartItems, showCheckout]);
  const handleAdd = (product, qty = 1) => {
    setStockError("");
    if (product.type === "product") {
      const existingItem = cartItems.find((i) => i._id === product._id);
      const currentQty = existingItem ? existingItem.qty : 0;
      if (currentQty + qty > Number(product.stockQty)) {
        setStockError(`⚠️ "${product.name}" ka stock sirf ${product.stockQty} hai!`);
        setTimeout(() => setStockError(""), 3000);
        return;
      }
    }
    playAddSound();
    setAnimatingId(product._id);
    setTimeout(() => setAnimatingId(null), 400);
    setCartItems((prev) => {
      const exists = prev.find((i) => i._id === product._id);
      if (exists) return prev.map((i) => i._id === product._id ? { ...i, qty: i.qty + qty } : i);
      return [...prev, { ...product, qty }];
    });
    setRecentlyAdded((prev) => {
      const filtered = prev.filter((p) => p._id !== product._id);
      return [product, ...filtered].slice(0, 5);
    });
  };

  const handleIncrease = (id) => {
    setStockError("");
    const item = cartItems.find((i) => i._id === id);
    if (item && item.type === "product" && item.qty >= Number(item.stockQty)) {
      setStockError(`⚠️ "${item.name}" ka stock sirf ${item.stockQty} hai!`);
      setTimeout(() => setStockError(""), 3000);
      return;
    }
    setCartItems((prev) => prev.map((i) => i._id === id ? { ...i, qty: i.qty + 1 } : i));
  };

  const handleDecrease = (id) => setCartItems((prev) => prev.map((i) => i._id === id ? { ...i, qty: i.qty - 1 } : i).filter((i) => i.qty > 0));
  const handleRemove = (id) => setCartItems((prev) => prev.filter((i) => i._id !== id));

  const handleBarcodeSearch = async () => {
    if (!barcodeInput.trim()) return;
    try {
      const res = await http.get(`/products?q=${barcodeInput}&active=true`);
      const products = res.data || res || [];
      if (products.length > 0) { handleAdd(products[0]); setBarcodeInput(""); }
    } catch { }
  };

const handleConfirmSale = async ({ paymentMethod, cashAmount, cardAmount, amountPaid }) => {
  const items = cartItems.map((i) => ({ productId: i._id, qty: i.qty }));
  
  // ✅ amountPaid fix — card/online pe total hi bhejo
  const finalAmountPaid = paymentMethod === "cash" 
    ? (amountPaid || cashAmount || total)
    : total;

  const res = await http.post("/sales", {
    items,
    discount,
    paymentMethod,
    amountPaid: finalAmountPaid,
  });

  const saleId = res.saleId || res.data?.saleId || res._id || res.data?._id;
  setCartItems([]);
  setDiscount(0);
  setShowCheckout(false);
  setRecentlyAdded([]);
  navigate(`/receipt/${saleId}`);
};
  const subtotal = cartItems.reduce((sum, i) => sum + i.price * i.qty, 0);
  const total = calcTotal(subtotal, discount, taxPercent);
  const cartCount = cartItems.reduce((sum, i) => sum + i.qty, 0);

  return (
    <div style={styles.page}>
      <div style={styles.left}>
        {/* Top bar */}
        <div style={styles.topBar}>
          <div style={styles.topBarLeft}>
            <h2 style={styles.heading}>🛒 POS</h2>
            <div style={styles.shortcuts}>
              {[
                { key: "F1", label: "Checkout" },
                { key: "F2", label: "New Sale" },
                { key: "F3", label: "Scanner" },
                { key: "F4", label: "Search" },
                { key: "Del", label: "Remove Last" },
                { key: "+/-", label: "Qty" },
              ].map((s) => (
                <span key={s.key} style={styles.shortcutChip}>
                  <span style={styles.shortcutKey}>{s.key}</span>
                  <span style={styles.shortcutLabel}>{s.label}</span>
                </span>
              ))}
            </div>
          </div>
          <button
            onClick={() => { setShowScanner((p) => !p); setTimeout(() => barcodeRef.current?.focus(), 100); }}
            style={styles.scanToggleBtn}
          >
            📷 <span style={styles.fKey}>F3</span>
          </button>
        </div>

        {stockError && <div style={styles.stockToast}>{stockError}</div>}

        {showScanner && (
          <div style={styles.scannerBar}>
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
            <button onClick={() => { setShowScanner(false); searchRef.current?.focus(); }} style={styles.scanClose}>✕</button>
          </div>
        )}

        {recentlyAdded.length > 0 && (
          <div style={styles.recentBar}>
            <span style={styles.recentLabel}>🕐</span>
            {recentlyAdded.map((p) => (
              <button key={p._id} onClick={(e) => { e.stopPropagation(); handleAdd(p); }} style={styles.recentChip}>
                {p.name} <span style={styles.recentPrice}>Rs {p.price?.toLocaleString()}</span>
              </button>
            ))}
          </div>
        )}

        <ProductList
          onAdd={handleAdd}
          animatingId={animatingId}
          cartItems={cartItems}
          searchRef={searchRef}
        />
      </div>

      {/* Permanent Cart */}
      <div style={styles.cartSidebar}>
        <Cart
          items={cartItems}
          discount={discount}
          taxPercent={taxPercent}
          onIncrease={handleIncrease}
          onDecrease={handleDecrease}
          onRemove={handleRemove}
          onCheckout={() => setShowCheckout(true)}
          onDiscountChange={setDiscount}
          cartCount={cartCount}
          total={total}
        />
      </div>

      {showCheckout && (
        <CheckoutModal
          total={total}
          onConfirm={handleConfirmSale}
          onClose={() => { setShowCheckout(false); setTimeout(() => searchRef.current?.focus(), 100); }}
        />
      )}

      <style>{`
        @keyframes cartBounce { 0%{transform:scale(1)} 40%{transform:scale(1.15)} 70%{transform:scale(0.95)} 100%{transform:scale(1)} }
        @keyframes fadeToast { from{opacity:0;transform:translateX(-50%) translateY(-8px)} to{opacity:1;transform:translateX(-50%) translateY(0)} }
        .add-animate { animation: cartBounce 0.4s ease; }
      `}</style>
    </div>
  );
}

const styles = {
  page: { display: "flex", height: "100vh", overflow: "hidden" },
  left: { flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", paddingRight: 0 },
  topBar: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px 8px", flexShrink: 0, borderBottom: "1px solid rgba(255,255,255,0.04)" },
  topBarLeft: { display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" },
  heading: { fontSize: 16, fontWeight: "800", color: "#f1f5f9", margin: 0 },
  shortcuts: { display: "flex", gap: 4, flexWrap: "wrap" },
  shortcutChip: { display: "flex", alignItems: "center", gap: 3, backgroundColor: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 5, padding: "2px 7px" },
  shortcutKey: { fontSize: 9, color: "#60a5fa", fontFamily: "monospace", fontWeight: "700" },
  shortcutLabel: { fontSize: 9, color: "#334155" },
  fKey: { fontSize: 9, backgroundColor: "rgba(0,245,255,0.12)", padding: "1px 4px", borderRadius: 3, fontFamily: "monospace", color: "#00f5ff" },
  scanToggleBtn: { padding: "6px 12px", backgroundColor: "rgba(0,245,255,0.06)", color: "#00f5ff", border: "1px solid rgba(0,245,255,0.15)", borderRadius: 7, cursor: "pointer", fontSize: 12, fontWeight: "700", display: "flex", alignItems: "center", gap: 5 },
  stockToast: { position: "fixed", top: 16, left: "50%", transform: "translateX(-50%)", backgroundColor: "rgba(239,68,68,0.92)", color: "#fff", padding: "10px 20px", borderRadius: 10, fontSize: 13, fontWeight: "600", zIndex: 999, whiteSpace: "nowrap", animation: "fadeToast 0.3s ease", backdropFilter: "blur(10px)", boxShadow: "0 4px 20px rgba(239,68,68,0.4)" },
  scannerBar: { display: "flex", alignItems: "center", gap: 8, backgroundColor: "rgba(0,245,255,0.04)", border: "1px solid rgba(0,245,255,0.12)", borderRadius: 8, padding: "7px 10px", margin: "6px 12px", flexShrink: 0 },
  scannerInput: { flex: 1, padding: "7px 10px", borderRadius: 7, border: "1px solid rgba(0,245,255,0.15)", background: "rgba(0,0,0,0.3)", color: "#fff", fontSize: 13, outline: "none" },
  scanBtn: { padding: "6px 12px", backgroundColor: "rgba(0,245,255,0.12)", color: "#00f5ff", border: "1px solid rgba(0,245,255,0.2)", borderRadius: 6, cursor: "pointer", fontSize: 11, fontWeight: "700" },
  scanClose: { background: "none", border: "none", color: "#334155", cursor: "pointer", fontSize: 15 },
  recentBar: { display: "flex", alignItems: "center", gap: 5, padding: "4px 12px 6px", flexWrap: "wrap", flexShrink: 0 },
  recentLabel: { fontSize: 12 },
  recentChip: { padding: "2px 9px", borderRadius: 20, backgroundColor: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", color: "#94a3b8", fontSize: 10, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 },
  recentPrice: { color: "#3b82f6", fontSize: 9 },
  cartSidebar: { width: 340, flexShrink: 0, height: "100%", backgroundColor: "rgba(8,12,24,0.98)", borderLeft: "1px solid rgba(255,255,255,0.05)", display: "flex", flexDirection: "column" },
};