import { DOC_PREFIX } from "./constants";

/**
 * Generate a reference number for documents
 * Format: PREFIX-YYYY-XXXX (e.g., PEX-QT-2024-0001)
 */
export function generateReferenceNumber(
  prefix: keyof typeof DOC_PREFIX,
  counter: number
): string {
  const year = new Date().getFullYear();
  const paddedCounter = counter.toString().padStart(4, "0");
  return `${DOC_PREFIX[prefix]}-${year}-${paddedCounter}`;
}

/**
 * Generate a URL-friendly slug from text
 */
export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

/**
 * Generate an empty leg slug
 * Format: departure-to-arrival-date (e.g., lagos-to-abuja-dec-15-2024)
 */
export function generateEmptyLegSlug(
  departure: string,
  arrival: string,
  date: Date
): string {
  const depSlug = generateSlug(departure);
  const arrSlug = generateSlug(arrival);
  const dateStr = date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  const dateSlug = generateSlug(dateStr);
  return `${depSlug}-to-${arrSlug}-${dateSlug}`;
}

/**
 * Generate a random OTP
 */
export function generateOTP(length: number = 6): string {
  const digits = "0123456789";
  let otp = "";
  for (let i = 0; i < length; i++) {
    otp += digits[Math.floor(Math.random() * digits.length)];
  }
  return otp;
}

/**
 * Generate a default password from name and phone
 * Format: firstname + last 4 digits of phone
 */
export function generateDefaultPassword(
  fullName: string,
  phone: string
): string {
  const firstName = fullName.split(" ")[0].toLowerCase();
  const lastFourDigits = phone.replace(/\D/g, "").slice(-4);
  return `${firstName}${lastFourDigits}`;
}

/**
 * Format phone number to international format
 */
export function formatPhoneNumber(phone: string): string {
  // Remove all non-digit characters
  const digits = phone.replace(/\D/g, "");
  
  // If starts with 0, assume Nigerian and add +234
  if (digits.startsWith("0")) {
    return `+234${digits.slice(1)}`;
  }
  
  // If doesn't start with +, add it
  if (!phone.startsWith("+")) {
    return `+${digits}`;
  }
  
  return phone;
}

/**
 * Format currency
 */
export function formatCurrency(
  amount: number,
  currency: "NGN" | "USD" = "NGN"
): string {
  const formatter = new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
  return formatter.format(amount);
}

/**
 * Format date and time
 */
export function formatDateTime(date: Date | string): string {
  const d = new Date(date);
  return d.toLocaleString("en-NG", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

/**
 * Format date only
 */
export function formatDate(date: Date | string): string {
  const d = new Date(date);
  return d.toLocaleDateString("en-NG", {
    dateStyle: "medium",
  });
}

/**
 * Format time only
 */
export function formatTime(date: Date | string): string {
  const d = new Date(date);
  return d.toLocaleTimeString("en-NG", {
    timeStyle: "short",
  });
}

/**
 * Calculate flight duration in minutes based on distance
 * Rough estimate: average speed of 450 knots
 */
export function estimateFlightDuration(
  distanceNm: number,
  cruiseSpeedKnots: number = 450
): number {
  // Add 30 minutes for takeoff and landing
  const flightTimeMinutes = (distanceNm / cruiseSpeedKnots) * 60;
  return Math.round(flightTimeMinutes + 30);
}

/**
 * Calculate distance between two coordinates using Haversine formula
 * Returns distance in nautical miles
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 3440.065; // Earth's radius in nautical miles
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}

/**
 * Format duration in minutes to human readable
 */
export function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours === 0) return `${mins}m`;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}m`;
}

/**
 * Calculate estimated arrival time
 */
export function calculateEstimatedArrival(
  departureTime: Date,
  durationMinutes: number
): Date {
  return new Date(departureTime.getTime() + durationMinutes * 60 * 1000);
}

/**
 * Check if a date is in the past
 */
export function isPastDate(date: Date | string): boolean {
  return new Date(date) < new Date();
}

/**
 * Check if a date is within deadline
 */
export function isWithinDeadline(
  flightDate: Date | string,
  deadlineMinutes: number
): boolean {
  const flight = new Date(flightDate);
  const deadline = new Date(flight.getTime() - deadlineMinutes * 60 * 1000);
  return new Date() < deadline;
}

/**
 * Calculate payment deadline
 */
export function calculatePaymentDeadline(hours: number = 3): Date {
  return new Date(Date.now() + hours * 60 * 60 * 1000);
}

/**
 * Truncate text with ellipsis
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + "...";
}

/**
 * Capitalize first letter of each word
 */
export function titleCase(text: string): string {
  return text
    .toLowerCase()
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/**
 * Parse pagination params with defaults
 */
export function parsePaginationParams(params: {
  page?: string | number;
  limit?: string | number;
  sortBy?: string;
  sortOrder?: string;
}): {
  page: number;
  limit: number;
  skip: number;
  sortBy: string;
  sortOrder: "asc" | "desc";
} {
  const page = Math.max(1, Number(params.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(params.limit) || 20));
  const skip = (page - 1) * limit;
  const sortBy = params.sortBy || "createdAt";
  const sortOrder = params.sortOrder === "asc" ? "asc" : "desc";
  
  return { page, limit, skip, sortBy, sortOrder };
}

/**
 * Create pagination metadata
 */
export function createPaginationMeta(
  total: number,
  page: number,
  limit: number
) {
  return {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  };
}
