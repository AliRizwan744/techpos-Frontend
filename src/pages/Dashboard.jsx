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
  time: { fontSize: 28, fontWeight: "800", color: "#00f5ff", letterSpacing: 3, fontFamily: "monospace", textShadow: "0 0 20px #00f5ff, 0 0 40px #00f5ff" },
  date: { fontSize: 11, color: "#4a5568", letterSpacing: 1, marginTop: 2 },
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
      {/* Gradient border top */}
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
    borderRadius: 16, padding: "22px 20px",
    border: "1px solid",
    backdropFilter: "blur(20px)",
    transition: "all 0.3s ease",
    cursor: "default", position: "relative", overflow: "hidden",
  },
  topBar: { position: "absolute", top: 0, left: 0, right: 0, height: 2, borderRadius: "16px 16px 0 0" },
  iconRow: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 },
  icon: { fontSize: 26 },
  dot: { width: 8, height: 8, borderRadius: "50%" },
  value: { fontSize: 24, fontWeight: "800", marginBottom: 6, fontFamily: "monospace", letterSpacing: 1 },
  label: { fontSize: 11, color: "#4a5568", textTransform: "uppercase", letterSpacing: 1.5, fontWeight: "600" },
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
  }, []);

  const cards = summary ? [
    { label: "Total Sales", icon: "💰", color: "#00f5ff", rawValue: summary.totalSales, isAmount: true },
    { label: "Total Orders", icon: "🧾", color: "#bf00ff", rawValue: summary.totalOrders, isAmount: false },
    { label: "Avg Order", icon: "📦", color: "#00ff88", rawValue: summary.avgOrder, isAmount: true },
    { label: "Total Tax", icon: "🧮", color: "#ff6b35", rawValue: summary.totalTax, isAmount: true },
    { label: "Discounts", icon: "🏷", color: "#ff0080", rawValue: summary.totalDiscount, isAmount: true },
  ] : [];

  const neonColors = ["#00f5ff", "#bf00ff", "#00ff88", "#ff6b35", "#ff0080", "#f5c842"];

  if (loading) return (
    <div style={styles.loadingBox}>
      <div style={styles.spinnerOuter}>
        <div style={styles.spinnerInner} />
      </div>
      <p style={styles.loadingText}>INITIALIZING DASHBOARD</p>
      <p style={styles.loadingSubtext}>Loading system data...</p>
    </div>
  );

  return (
    <div style={styles.page}>
      {/* Background grid effect */}
      <div style={styles.gridBg} />

      {/* Header */}
      <div style={styles.header}>
        <div>
          <div style={styles.headerBadge}>● LIVE DASHBOARD</div>
          <h2 style={styles.heading}>TECH POS</h2>
          <p style={styles.subheading}>30-day performance overview</p>
        </div>
        <LiveClock />
      </div>

      {/* Divider */}
      <div style={styles.divider} />

      {/* Cards */}
      <div style={styles.cardsGrid}>
        {cards.map((card, i) => <StatCard key={card.label} card={card} index={i} />)}
      </div>

      {/* Charts */}
      <div style={styles.chartsRow}>
        {/* Area Chart */}
        <div style={styles.chartBox}>
          <div style={styles.chartHeader}>
            <h3 style={styles.chartTitle}>DAILY SALES TREND</h3>
            <span style={{ ...styles.chartBadge, color: "#00f5ff", borderColor: "#00f5ff44" }}>LIVE</span>
          </div>
          {chartData.length === 0 ? (
            <p style={styles.noData}>No data available</p>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="cyanGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00f5ff" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#00f5ff" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,245,255,0.05)" />
                <XAxis dataKey="date" tick={{ fontSize: 9, fill: "#2d3748" }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 9, fill: "#2d3748" }} tickLine={false} axisLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip
                  formatter={(v) => [`Rs ${v.toLocaleString()}`, "Sales"]}
                  contentStyle={{ backgroundColor: "#0a0f1e", border: "1px solid #00f5ff44", borderRadius: 10, fontSize: 12, color: "#00f5ff" }}
                />
                <Area type="monotone" dataKey="total" stroke="#00f5ff" strokeWidth={2} fill="url(#cyanGrad)" dot={false} activeDot={{ r: 5, fill: "#00f5ff", boxShadow: "0 0 10px #00f5ff" }} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Bar Chart */}
        <div style={styles.chartBox}>
          <div style={styles.chartHeader}>
            <h3 style={styles.chartTitle}>TOP PRODUCTS</h3>
            <span style={{ ...styles.chartBadge, color: "#bf00ff", borderColor: "#bf00ff44" }}>QTY</span>
          </div>
          {topItems.length === 0 ? (
            <p style={styles.noData}>No data available</p>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={topItems} margin={{ top: 10, right: 10, left: 0, bottom: 40 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(191,0,255,0.05)" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 9, fill: "#2d3748" }} tickLine={false} axisLine={false} angle={-30} textAnchor="end" />
                <YAxis tick={{ fontSize: 9, fill: "#2d3748" }} tickLine={false} axisLine={false} />
                <Tooltip
                  formatter={(v) => [v, "Qty Sold"]}
                  contentStyle={{ backgroundColor: "#0a0f1e", border: "1px solid #bf00ff44", borderRadius: 10, fontSize: 12, color: "#bf00ff" }}
                />
                <Bar dataKey="qtySold" radius={[6, 6, 0, 0]}>
                  {topItems.map((_, i) => (
                    <Cell key={i} fill={neonColors[i % neonColors.length]}
                      style={{ filter: `drop-shadow(0 0 6px ${neonColors[i % neonColors.length]})` }}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Top Products Table */}
      <div style={styles.tableBox}>
        <div style={styles.chartHeader}>
          <h3 style={styles.chartTitle}>LEADERBOARD — TOP PRODUCTS</h3>
          <span style={{ ...styles.chartBadge, color: "#00ff88", borderColor: "#00ff8844" }}>REVENUE</span>
        </div>
        <table style={styles.table}>
          <thead>
            <tr>
              {["RANK", "PRODUCT", "QTY SOLD", "REVENUE"].map((h) => (
                <th key={h} style={styles.th}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {topItems.map((item, i) => (
              <tr key={i} style={styles.tableRow}>
                <td style={styles.td}>
                  <span style={{
                    ...styles.rank,
                    backgroundColor: `${neonColors[i]}22`,
                    color: neonColors[i],
                    border: `1px solid ${neonColors[i]}44`,
                    boxShadow: `0 0 10px ${neonColors[i]}44`,
                  }}>
                    {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${i + 1}`}
                  </span>
                </td>
                <td style={{ ...styles.td, color: "#e2e8f0", fontWeight: "600", letterSpacing: 0.5 }}>{item.name}</td>
                <td style={{ ...styles.td, color: "#bf00ff", fontFamily: "monospace" }}>{item.qtySold}</td>
                <td style={{ ...styles.td, textAlign: "right", color: "#00ff88", fontFamily: "monospace", fontWeight: "bold", textShadow: "0 0 10px #00ff88" }}>
                  {formatMoney(item.revenue)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes spinReverse { to { transform: rotate(-360deg); } }
        @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.5; } }
        @keyframes gridMove { from { transform: translateY(0); } to { transform: translateY(40px); } }
      `}</style>
    </div>
  );
}

const styles = {
  page: { maxWidth: 1200, margin: "0 auto", paddingBottom: 40, position: "relative" },
  gridBg: {
    position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none",
    backgroundImage: "linear-gradient(rgba(0,245,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0,245,255,0.03) 1px, transparent 1px)",
    backgroundSize: "40px 40px",
    animation: "gridMove 4s linear infinite",
  },
  loadingBox: { display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "70vh", gap: 20, position: "relative", zIndex: 1 },
  spinnerOuter: { width: 60, height: 60, border: "2px solid #00f5ff44", borderTop: "2px solid #00f5ff", borderRadius: "50%", animation: "spin 1s linear infinite", boxShadow: "0 0 20px #00f5ff44" },
  spinnerInner: { position: "absolute", width: 40, height: 40, margin: 10, border: "2px solid #bf00ff44", borderBottom: "2px solid #bf00ff", borderRadius: "50%", animation: "spinReverse 0.8s linear infinite" },
  loadingText: { fontSize: 14, color: "#00f5ff", letterSpacing: 4, fontFamily: "monospace", textShadow: "0 0 10px #00f5ff", animation: "pulse 1.5s ease-in-out infinite" },
  loadingSubtext: { fontSize: 11, color: "#2d3748", letterSpacing: 2, fontFamily: "monospace" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8, position: "relative", zIndex: 1 },
  headerBadge: { fontSize: 10, color: "#00ff88", letterSpacing: 2, fontFamily: "monospace", marginBottom: 6, animation: "pulse 2s ease-in-out infinite" },
  heading: { fontSize: 32, fontWeight: "900", color: "#f1f5f9", margin: "0 0 4px", letterSpacing: 4, textTransform: "uppercase" },
  subheading: { fontSize: 11, color: "#2d3748", letterSpacing: 2, textTransform: "uppercase" },
  divider: { height: 1, background: "linear-gradient(90deg, #00f5ff44, #bf00ff44, transparent)", marginBottom: 28, position: "relative", zIndex: 1 },
  cardsGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(190px, 1fr))", gap: 16, marginBottom: 24, position: "relative", zIndex: 1 },
  chartsRow: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 24, position: "relative", zIndex: 1 },
  chartBox: { backgroundColor: "rgba(0,0,0,0.4)", border: "1px solid rgba(0,245,255,0.1)", borderRadius: 16, padding: "20px 16px", backdropFilter: "blur(20px)" },
  chartHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  chartTitle: { fontSize: 11, fontWeight: "800", color: "#4a5568", letterSpacing: 2, margin: 0 },
  chartBadge: { fontSize: 9, fontWeight: "700", letterSpacing: 1.5, padding: "3px 8px", borderRadius: 4, border: "1px solid" },
  noData: { textAlign: "center", color: "#2d3748", padding: 40, fontFamily: "monospace" },
  tableBox: { backgroundColor: "rgba(0,0,0,0.4)", border: "1px solid rgba(0,255,136,0.1)", borderRadius: 16, padding: "20px", backdropFilter: "blur(20px)", position: "relative", zIndex: 1 },
  table: { width: "100%", borderCollapse: "collapse" },
  th: { padding: "10px 14px", fontSize: 9, color: "#2d3748", fontWeight: "800", textTransform: "uppercase", letterSpacing: 2, borderBottom: "1px solid rgba(255,255,255,0.04)", textAlign: "left" },
  tableRow: { borderBottom: "1px solid rgba(255,255,255,0.02)", transition: "background 0.2s" },
  td: { padding: "13px 14px", fontSize: 13, color: "#4a5568" },
  rank: { display: "inline-flex", alignItems: "center", justifyContent: "center", minWidth: 32, height: 28, borderRadius: 6, fontWeight: "800", fontSize: 12, padding: "0 6px" },
};