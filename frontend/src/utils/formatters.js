/**
 * Format date string into human readable date: e.g. "Oct 24, 2026"
 */
export const formatDate = (dateString) => {
  if (!dateString) return "TBD";
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

/**
 * Format date string into date & time: e.g. "Oct 24, 2026, 06:30 PM"
 */
export const formatDateTime = (dateString) => {
  if (!dateString) return "TBD";
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

/**
 * Format score to 2 decimal places or "-"
 */
export const formatScore = (score) => {
  if (score === null || score === undefined || isNaN(score)) return "—";
  return Number(score).toFixed(2);
};

/**
 * Truncate long strings with ellipsis
 */
export const truncateText = (text, maxLength = 80) => {
  if (!text) return "";
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + "...";
};

/**
 * Calculate countdown remaining time until deadline
 */
export const getTimeRemaining = (deadline) => {
  if (!deadline) return { total: 0, hours: 0, minutes: 0, isPassed: true };
  const total = new Date(deadline).getTime() - Date.now();
  if (total <= 0) return { total: 0, hours: 0, minutes: 0, isPassed: true };

  const hours = Math.floor(total / (1000 * 60 * 60));
  const minutes = Math.floor((total % (1000 * 60 * 60)) / (1000 * 60));
  return { total, hours, minutes, isPassed: false };
};
