export default function ErrorBox({ message, onRetry }) {
  if (!message) return null;

  return (
    <div style={styles.box}>
      <span style={styles.icon}>⚠️</span>
      <p style={styles.text}>{message}</p>
      {onRetry && (
        <button onClick={onRetry} style={styles.btn}>
          Retry
        </button>
      )}
    </div>
  );
}

const styles = {
  box: {
    backgroundColor: "#fff3f3",
    border: "1px solid #f5c6c6",
    borderRadius: 8,
    padding: "16px 20px",
    display: "flex",
    alignItems: "center",
    gap: 12,
    margin: "16px 0",
  },
  icon: {
    fontSize: 20,
  },
  text: {
    flex: 1,
    color: "#c0392b",
    fontSize: 14,
    margin: 0,
  },
  btn: {
    padding: "6px 14px",
    backgroundColor: "#c0392b",
    color: "#fff",
    border: "none",
    borderRadius: 6,
    cursor: "pointer",
    fontSize: 13,
  },
};