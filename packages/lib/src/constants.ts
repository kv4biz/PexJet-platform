// Application Constants

export const APP_NAME = "PexJet";

// Document Reference Prefixes
export const DOC_PREFIX = {
  QUOTE: "PEX-QT",
  EMPTY_LEG: "PEX-EL",
  RECEIPT: "PEX-RC",
  FLIGHT_CONFIRM: "PEX-FC",
} as const;

// Rejection Reasons
export const REJECTION_REASONS = {
  AIRCRAFT_UNAVAILABLE: "Aircraft Unavailable",
  ROUTE_NOT_SERVICEABLE: "Route Not Serviceable",
  INVALID_DATES: "Invalid Dates",
  PRICING_ISSUE: "Pricing Issue",
  CAPACITY_EXCEEDED: "Capacity Exceeded",
  DEAL_NOT_AVAILABLE: "Deal Not Available",
  NO_PAYMENT_MADE: "No Payment Made",
  OTHER: "Other",
} as const;

// Aircraft Categories Display Names
export const AIRCRAFT_CATEGORIES = {
  LIGHT_JET: "Light Jet",
  MIDSIZE_JET: "Midsize Jet",
  SUPER_MIDSIZE_JET: "Super Midsize Jet",
  HEAVY_JET: "Heavy Jet",
  ULTRA_LONG_RANGE: "Ultra Long Range",
  TURBOPROP: "Turboprop",
} as const;

// Aircraft Availability Display Names
export const AIRCRAFT_AVAILABILITY = {
  NONE: "Not Available",
  LOCAL: "Local Flights Only",
  INTERNATIONAL: "International Flights Only",
  BOTH: "Local & International",
} as const;

// Flight Types Display Names
export const FLIGHT_TYPES = {
  ONE_WAY: "One Way",
  ROUND_TRIP: "Round Trip",
  MULTI_LEG: "Multi-Leg",
} as const;

// Quote Status Display Names
export const QUOTE_STATUS = {
  PENDING: "Pending",
  APPROVED: "Approved",
  REJECTED: "Rejected",
  EXPIRED: "Expired",
  PAID: "Paid",
  COMPLETED: "Completed",
} as const;

// Empty Leg Status Display Names
export const EMPTY_LEG_STATUS = {
  PUBLISHED: "Published",
  OPEN: "Open",
  CLOSED: "Closed",
} as const;

// Payment Status Display Names
export const PAYMENT_STATUS = {
  PENDING: "Pending",
  SUCCESS: "Successful",
  FAILED: "Failed",
  REFUNDED: "Refunded",
} as const;

// Admin Roles Display Names
export const ADMIN_ROLES = {
  SUPER_ADMIN: "Super Admin",
  STAFF: "Staff",
} as const;

// Subscription Types Display Names
export const SUBSCRIPTION_TYPES = {
  CITY: "City",
  ROUTE: "Route",
  ALL: "All Deals",
} as const;

// Colors
export const COLORS = {
  PRIMARY: "#C9A227", // Metallic Gold
  PRIMARY_LIGHT: "#D4AF37",
  PRIMARY_DARK: "#B8860B",
  BLACK: "#000000",
  WHITE: "#FFFFFF",
  GRAY_50: "#F9FAFB",
  GRAY_100: "#F3F4F6",
  GRAY_200: "#E5E7EB",
  GRAY_300: "#D1D5DB",
  GRAY_400: "#9CA3AF",
  GRAY_500: "#6B7280",
  GRAY_600: "#4B5563",
  GRAY_700: "#374151",
  GRAY_800: "#1F2937",
  GRAY_900: "#111827",
} as const;

// Default Pagination
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

// File Upload Limits
export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

// OTP Settings
export const OTP_LENGTH = 6;
export const OTP_EXPIRY_MINUTES = 10;

// Token Expiry
export const ACCESS_TOKEN_EXPIRY = "15m";
export const REFRESH_TOKEN_EXPIRY = "7d";

// Nigerian Banks for Paystack
export const NIGERIAN_BANKS = [
  { code: "044", name: "Access Bank" },
  { code: "023", name: "Citibank Nigeria" },
  { code: "063", name: "Diamond Bank" },
  { code: "050", name: "Ecobank Nigeria" },
  { code: "084", name: "Enterprise Bank" },
  { code: "070", name: "Fidelity Bank" },
  { code: "011", name: "First Bank of Nigeria" },
  { code: "214", name: "First City Monument Bank" },
  { code: "058", name: "Guaranty Trust Bank" },
  { code: "030", name: "Heritage Bank" },
  { code: "301", name: "Jaiz Bank" },
  { code: "082", name: "Keystone Bank" },
  { code: "526", name: "Parallex Bank" },
  { code: "076", name: "Polaris Bank" },
  { code: "101", name: "Providus Bank" },
  { code: "221", name: "Stanbic IBTC Bank" },
  { code: "068", name: "Standard Chartered Bank" },
  { code: "232", name: "Sterling Bank" },
  { code: "100", name: "Suntrust Bank" },
  { code: "032", name: "Union Bank of Nigeria" },
  { code: "033", name: "United Bank For Africa" },
  { code: "215", name: "Unity Bank" },
  { code: "035", name: "Wema Bank" },
  { code: "057", name: "Zenith Bank" },
] as const;
