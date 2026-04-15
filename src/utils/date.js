// Format date to readable string
// Example: formatDate("2026-04-01T10:30:00") => "01 Apr 2026, 10:30 AM"
export const formatDate = (dateStr) => {
  if (!dateStr) return "—";

  const date = new Date(dateStr);
  return date.toLocaleString("en-PK", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};

// Format date only (no time)
// Example: formatDateOnly("2026-04-01T10:30:00") => "01 Apr 2026"
export const formatDateOnly = (dateStr) => {
  if (!dateStr) return "—";

  const date = new Date(dateStr);
  return date.toLocaleDateString("en-PK", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

// Get today's date in YYYY-MM-DD format (for input fields)
// Example: todayInput() => "2026-04-01"
export const todayInput = () => {
  return new Date().toISOString().split("T")[0];
};

// Get date 30 days ago in YYYY-MM-DD format
// Example: thirtyDaysAgoInput() => "2026-03-02"
export const thirtyDaysAgoInput = () => {
  const date = new Date();
  date.setDate(date.getDate() - 30);
  return date.toISOString().split("T")[0];
};

// Check if date string is valid
export const isValidDate = (dateStr) => {
  if (!dateStr) return false;
  const date = new Date(dateStr);
  return !isNaN(date.getTime());
};