import { useState, useEffect, useRef } from "react";
import http from "../api/http";
import { formatMoney } from "../utils/money";
import { todayInput, thirtyDaysAgoInput } from "../utils/date";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, BarChart, Bar, Cell
} from "recharts";

// ✅ Animated counter hook
function useCountUp(target, duration = 1500) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!target) return;
    let start = 0;
    const num = parseFloat(target.toString().replace(/[^0-9.]/g, "")) || 0;
    const step = num / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= num) { setCount(num); clearInterval(timer); }
      else setCount(start);
    }, 16);
    return () => clearInterval(timer);
  }, [target]);
  return count;
}

// ✅ Live clock
function LiveClock() {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  return (
    <div style={clockStyles.wrapper}>
      <div style={clockStyles.time}>
        {time.toLocaleTimeString("en-PK", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
      </div>
      <div style={clockStyles.date}>
        {time.toLocaleDateString("en-PK", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
      </div>
    </div>
  );
}

const clockStyles = {
  wrapper: { textAlign: "right" },
  time: { fontSize: 24, fontWeight: "800", color: "#93c5fd", letterSpacing: 2, fontFamily: "monospace" },
  date: { fontSize: 10, color: "#4a5568", letterSpacing: 1, marginTop: 2 },
};

// ✅ Single animated card
function StatCard({ card, index }) {
  const [hovered, setHovered] = useState(false);
  const num = parseFloat(card.rawValue) || 0;
  const counted = useCountUp(num);
  const display = card.isAmount
    ? `Rs ${Math.round(counted).toLocaleString()}`
    : Math.round(counted).toString();

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        ...cardStyles.card,
        background: hovered
          ? `linear-gradient(135deg, ${card.color}22, ${card.color}11)`
          : "rgba(255,255,255,0.02)",
        borderColor: hovered ? card.color : `${card.color}44`,
        boxShadow: hovered
          ? `0 0 30px ${card.color}44, inset 0 0 30px ${card.color}11`
          : `0 0 10px ${card.color}22`,
        transform: hovered ? "translateY(-4px) scale(1.02)" : "translateY(0) scale(1)",
      }}
    >
      <div style={{ ...cardStyles.topBar, background: card.color, boxShadow: `0 0 10px ${card.color}` }} />
      <div style={cardStyles.iconRow}>
        <span style={{ ...cardStyles.icon, filter: `drop-shadow(0 0 8px ${card.color})` }}>{card.icon}</span>
        <div style={{ ...cardStyles.dot, backgroundColor: card.color, boxShadow: `0 0 8px ${card.color}` }} />
      </div>
      <div style={{ ...cardStyles.value, color: card.color, textShadow: `0 0 20px ${card.color}` }}>
        {display}
      </div>
      <div style={cardStyles.label}>{card.label}</div>
    </div>
  );
}

const cardStyles = {
  card: {
    borderRadius: 16, padding: "18px 16px",
    border: "1px solid",
    backdropFilter: "blur(20px)",
    transition: "all 0.3s ease",
    cursor: "default", position: "relative", overflow: "hidden",
  },
  topBar: { position: "absolute", top: 0, left: 0, right: 0, height: 2, borderRadius: "16px 16px 0 0" },
  iconRow: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  icon: { fontSize: 22 },
  dot: { width: 6, height: 6, borderRadius: "50%" },
  value: { fontSize: 20, fontWeight: "800", marginBottom: 4, fontFamily: "monospace", letterSpacing: 1 },
  label: { fontSize: 10, color: "#4a5568", textTransform: "uppercase", letterSpacing: 1.2, fontWeight: "600" },
};

export default function Dashboard() {
  const [summary, setSummary] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [topItems, setTopItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [from] = useState(thirtyDaysAgoInput());
  const [to] = useState(todayInput());

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [summaryRes, salesRes, topRes] = await Promise.all([
          http.get(`/reports/summary?from=${from}&to=${to}`),
          http.get(`/sales?from=${from}&to=${to}`),
          http.get(`/reports/top-items?from=${from}&to=${to}`),
        ]);
        const s = summaryRes.data || summaryRes;
        const sales = salesRes.data || salesRes || [];
        const top = topRes.data || topRes || [];
        setSummary(s);
        setTopItems(top.slice(0, 6));
        const grouped = {};
        sales.forEach((sale) => {
          const date = new Date(sale.createdAt).toLocaleDateString("en-PK", { month: "short", day: "numeric" });
          grouped[date] = (grouped[date] || 0) + (sale.total || 0);
        });
        setChartData(Object.entries(grouped).map(([date, total]) => ({ date, total })));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [from, to]);

  const cards = summary ? [
    { label: "Total Sales", icon: "💰", color: "#3b82f6", rawValue: summary.totalSales, isAmount: true },
    { label: "Total Orders", icon: "🧾", color: "#6366f1", rawValue: summary.totalOrders, isAmount: false },
    { label: "Avg Order", icon: "📦", color: "#0ea5e9", rawValue: summary.avgOrder, isAmount: true },
    { label: "Total Tax", icon: "💵", color: "#8b5cf6", rawValue: summary.totalTax, isAmount: true },
    { label: "Discounts", icon: "💸", color: "#06b6d4", rawValue: summary.totalDiscount, isAmount: true },
  ] : [];

  const neonColors = ["#3b82f6", "#6366f1", "#0ea5e9", "#8b5cf6", "#06b6d4", "#2563eb"];

  if (loading) return (
    <div style={styles.loadingBox}>
      <div style={styles.spinnerOuter}><div style={styles.spinnerInner} /></div>
      <p style={styles.loadingText}>INITIALIZING DASHBOARD</p>
    </div>
  );

  return (
    <div style={styles.page}>
      <div style={styles.gridBg} />
      
      <div style={styles.header}>
        <div>
          <div style={styles.headerBadge}>● LIVE DASHBOARD</div>
          <h2 style={styles.heading}>TECH POS</h2>
          <p style={styles.subheading}>30-day performance overview</p>
        </div>
        <LiveClock />
      </div>

      <div style={styles.divider} />

      <div style={styles.cardsGrid}>
        {cards.map((card, i) => <StatCard key={card.label} card={card} index={i} />)}
      </div>

      <div style={styles.chartsRow}>
        <div style={styles.chartBox}>
          <div style={styles.chartHeader}>
            <h3 style={styles.chartTitle}>DAILY SALES TREND</h3>
            <span style={{ ...styles.chartBadge, color: "#00f5ff", borderColor: "#00f5ff44" }}>LIVE</span>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="cyanGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00f5ff" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#00f5ff" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,245,255,0.05)" />
              <XAxis dataKey="date" tick={{ fontSize: 9, fill: "#718096" }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 9, fill: "#718096" }} tickLine={false} axisLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
              <Tooltip contentStyle={{ backgroundColor: "#0a0f1e", border: "1px solid #00f5ff44", borderRadius: 10, fontSize: 12, color: "#00f5ff" }} />
              <Area type="monotone" dataKey="total" stroke="#00f5ff" strokeWidth={2} fill="url(#cyanGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div style={styles.chartBox}>
          <div style={styles.chartHeader}>
            <h3 style={styles.chartTitle}>TOP PRODUCTS</h3>
            <span style={{ ...styles.chartBadge, color: "#bf00ff", borderColor: "#bf00ff44" }}>QTY</span>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={topItems} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
              <XAxis dataKey="name" tick={{ fontSize: 8, fill: "#718096" }} tickLine={false} axisLine={false} />
              <Bar dataKey="qtySold" radius={[4, 4, 0, 0]}>
                {topItems.map((_, i) => <Cell key={i} fill={neonColors[i % neonColors.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div style={styles.tableBox}>
        <div style={styles.chartHeader}>
          <h3 style={styles.chartTitle}>LEADERBOARD — TOP PRODUCTS</h3>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={styles.table}>
            <thead>
              <tr>
                {["RANK", "PRODUCT", "QTY", "REVENUE"].map((h) => <th key={h} style={styles.th}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {topItems.map((item, i) => (
                <tr key={i} style={styles.tableRow}>
                  <td style={styles.td}><span style={{ ...styles.rank, color: neonColors[i % 6] }}>{i + 1}</span></td>
                  <td style={{ ...styles.td, color: "#e2e8f0" }}>{item.name}</td>
                  <td style={styles.td}>{item.qtySold}</td>
                  <td style={{ ...styles.td, textAlign: "right", color: "#00ff88" }}>{formatMoney(item.revenue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.5; } }
      `}</style>
    </div>
  );
}

const styles = {
  // ✅ Yahan width 100% kar di gai hai aur maxWidth hata di gai hai
  page: { width: "100%", padding: "20px", boxSizing: "border-box", position: "relative", minHeight: "100vh" },
  gridBg: { position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none", backgroundImage: "radial-gradient(rgba(0,245,255,0.05) 1px, transparent 1px)", backgroundSize: "30px 30px" },
  loadingBox: { display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "80vh", gap: 20 },
  spinnerOuter: { width: 50, height: 50, border: "2px solid #00f5ff44", borderTop: "2px solid #00f5ff", borderRadius: "50%", animation: "spin 1s linear infinite" },
  loadingText: { fontSize: 12, color: "#00f5ff", letterSpacing: 3, fontFamily: "monospace" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10, position: "relative", zIndex: 1 },
  heading: { fontSize: 28, fontWeight: "900", color: "#f1f5f9", margin: 0, letterSpacing: 2 },
  subheading: { fontSize: 10, color: "#4a5568", textTransform: "uppercase" },
  divider: { height: 1, background: "linear-gradient(90deg, #00f5ff44, transparent)", marginBottom: 20 },
  cardsGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 15, marginBottom: 20, position: "relative", zIndex: 1 },
  chartsRow: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))", gap: 20, marginBottom: 20, position: "relative", zIndex: 1 },
  chartBox: { backgroundColor: "rgba(15, 23, 42, 0.6)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 16, padding: "16px", backdropFilter: "blur(10px)" },
  chartHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  chartTitle: { fontSize: 10, fontWeight: "800", color: "#718096", letterSpacing: 1 },
  tableBox: { backgroundColor: "rgba(15, 23, 42, 0.6)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 16, padding: "16px", position: "relative", zIndex: 1 },
  table: { width: "100%", borderCollapse: "collapse" },
  th: { padding: "8px", fontSize: 9, color: "#4a5568", textAlign: "left", borderBottom: "1px solid rgba(255,255,255,0.05)" },
  td: { padding: "10px 8px", fontSize: 12, color: "#718096" },
  rank: { fontWeight: "bold" }
};