/**
 * Format a number as USD currency (e.g., $10.00)
 */
export function formatUSD(amount: number | null | undefined): string {
  if (amount == null) return "$0.00";
  return `$${amount.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/**
 * Format a number as NGN currency (e.g., ₦10.00)
 */
export function formatNGN(amount: number | null | undefined): string {
  if (amount == null) return "₦0.00";
  return `₦${amount.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/**
 * Format a number as currency with the specified currency code
 */
export function formatCurrency(
  amount: number,
  currency: "USD" | "NGN" = "NGN",
): string {
  if (currency === "USD") {
    return formatUSD(amount);
  }
  return formatNGN(amount);
}

/**
 * Format duration in minutes to human readable format (e.g., "2h 30m")
 */
export function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours === 0) {
    return `${mins}m`;
  }
  if (mins === 0) {
    return `${hours}h`;
  }
  return `${hours}h ${mins}m`;
}

/**
 * Format date as local time (LT).
 * Since we store local time as UTC in the database, we use UTC methods
 * to extract the values without timezone conversion.
 */
export function formatDate(date: string | Date): string {
  const d = new Date(date);
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  const month = months[d.getUTCMonth()];
  const day = d.getUTCDate();
  const year = d.getUTCFullYear();
  return `${month} ${day}, ${year}`;
}

/**
 * Format time as local time (LT) in 24-hour format.
 * Since we store local time as UTC in the database, we use UTC methods
 * to extract the values without timezone conversion.
 */
export function formatTime(date: string | Date): string {
  const d = new Date(date);
  const hours = String(d.getUTCHours()).padStart(2, "0");
  const minutes = String(d.getUTCMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
}

/**
 * Format date and time together as local time (LT)
 */
export function formatDateTime(date: string | Date): string {
  return `${formatDate(date)} at ${formatTime(date)} LT`;
}
