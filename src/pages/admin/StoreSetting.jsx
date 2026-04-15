import { useState, useEffect } from "react";
import http from "../../api/http";

export default function StoreSettings() {
  const [form, setForm] = useState({
    name: "",
    currency: "Rs",
    taxPercent: 0,
    receiptFooter: "",
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchStore = async () => {
      try {
        const res = await http.get("/store");
        const store = res.data || res;
        setForm({
          name: store.name || "",
          currency: store.currency || "Rs",
          taxPercent: store.taxPercent || 0,
          receiptFooter: store.receiptFooter || "",
        });
      } catch (err) {
        setError(err.message);
      }
    };
    fetchStore();
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      setMessage("");
      setError("");
      await http.put("/store", form);
      setMessage("Store settings saved!");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <h2 style={styles.heading}>⚙️ Store Settings</h2>

      {message && <div style={styles.success}>{message}</div>}
      {error && <div style={styles.error}>{error}</div>}

      <div style={styles.form}>
        <label style={styles.label}>Store Name</label>
        <input name="name" value={form.name} onChange={handleChange} style={styles.input} />

        <label style={styles.label}>Currency</label>
        <input name="currency" value={form.currency} onChange={handleChange} style={styles.input} />

        <label style={styles.label}>Tax %</label>
        <input name="taxPercent" type="number" value={form.taxPercent} onChange={handleChange} style={styles.input} />

        <label style={styles.label}>Receipt Footer</label>
        <input name="receiptFooter" value={form.receiptFooter} onChange={handleChange} style={styles.input} />

        <button onClick={handleSave} disabled={loading} style={styles.btn}>
          {loading ? "Saving..." : "Save Settings"}
        </button>
      </div>
    </div>
  );
}

const styles = {
  page: { maxWidth: 500, margin: "0 auto" },
  heading: { fontSize: 22, fontWeight: "bold", marginBottom: 20 },
  success: { backgroundColor: "#d1fae5", color: "#065f46", padding: "10px 14px", borderRadius: 8, marginBottom: 16 },
  error: { backgroundColor: "#fee2e2", color: "#dc2626", padding: "10px 14px", borderRadius: 8, marginBottom: 16 },
  form: { display: "flex", flexDirection: "column", gap: 12 },
  label: { fontSize: 14, fontWeight: "500", color: "#374151" },
  input: { padding: "10px 12px", border: "1px solid #d1d5db", borderRadius: 8, fontSize: 14 },
  btn: { padding: "12px", backgroundColor: "#2563eb", color: "#fff", border: "none", borderRadius: 8, fontSize: 15, cursor: "pointer", marginTop: 8 },
};