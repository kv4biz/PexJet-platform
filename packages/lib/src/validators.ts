import { z } from "zod";

// Common validators
export const phoneSchema = z
  .string()
  .min(10, "Phone number must be at least 10 digits")
  .regex(/^[+]?[\d\s-]+$/, "Invalid phone number format");

export const emailSchema = z.string().email("Invalid email address");

export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter")
  .regex(/[0-9]/, "Password must contain at least one number");

export const usernameSchema = z
  .string()
  .min(3, "Username must be at least 3 characters")
  .max(30, "Username must be at most 30 characters")
  .regex(
    /^[a-zA-Z0-9_]+$/,
    "Username can only contain letters, numbers, and underscores",
  );

// Auth validators
export const loginSchema = z.object({
  identifier: z.string().min(1, "Email or username is required"),
  password: z.string().min(1, "Password is required"),
});

export const passwordResetRequestSchema = z.object({
  identifier: z.string().min(1, "Email or username is required"),
});

export const passwordResetVerifySchema = z.object({
  identifier: z.string().min(1, "Email or username is required"),
  otp: z.string().length(6, "OTP must be 6 digits"),
});

export const passwordResetCompleteSchema = z.object({
  identifier: z.string().min(1, "Email or username is required"),
  otp: z.string().length(6, "OTP must be 6 digits"),
  newPassword: passwordSchema,
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: passwordSchema,
});

// Admin validators
export const createAdminSchema = z.object({
  email: emailSchema,
  username: usernameSchema,
  fullName: z.string().min(2, "Full name must be at least 2 characters"),
  phone: phoneSchema,
  role: z.enum(["SUPER_ADMIN", "STAFF"]),
  address: z.string().optional(),
});

export const updateAdminSchema = createAdminSchema.partial();

// Operator validators
export const createOperatorSchema = z.object({
  email: emailSchema,
  username: usernameSchema,
  fullName: z.string().min(2, "Full name must be at least 2 characters"),
  phone: phoneSchema,
  bankName: z.string().min(2, "Bank name is required"),
  bankAccountNumber: z
    .string()
    .min(10, "Account number must be at least 10 digits"),
  bankAccountName: z.string().min(2, "Account name is required"),
  commissionPercent: z.number().min(0).max(100),
});

export const updateOperatorSchema = createOperatorSchema.partial();

// Aircraft validators
export const createAircraftSchema = z.object({
  name: z.string().min(2, "Aircraft name is required"),
  manufacturer: z.string().min(2, "Manufacturer is required"),
  model: z.string().min(1, "Model is required"),
  category: z.enum([
    "LIGHT_JET",
    "MIDSIZE_JET",
    "SUPER_MIDSIZE_JET",
    "HEAVY_JET",
    "ULTRA_LONG_RANGE",
    "TURBOPROP",
  ]),
  availability: z
    .enum(["NONE", "LOCAL", "INTERNATIONAL", "BOTH"])
    .default("NONE"),
  passengerCapacityMin: z.number().int().min(1),
  passengerCapacityMax: z.number().int().min(1),
  rangeNm: z.number().int().min(1),
  cruiseSpeedKnots: z.number().int().min(1),
  baggageCapacityCuFt: z.number().optional(),
  cabinLengthFt: z.number().optional(),
  cabinWidthFt: z.number().optional(),
  cabinHeightFt: z.number().optional(),
  lengthFt: z.number().optional(),
  wingspanFt: z.number().optional(),
  heightFt: z.number().optional(),
  yearOfManufacture: z.number().int().optional(),
  hourlyRateUsd: z.number().optional(),
  description: z.string().optional(),
  exteriorImages: z.array(z.string()).optional(),
  interiorImages: z.array(z.string()).optional(),
  thumbnailImage: z.string().optional(),
});

export const updateAircraftSchema = createAircraftSchema.partial();

// Charter Quote validators
export const charterLegSchema = z.object({
  departureAirportId: z.string().min(1, "Departure airport is required"),
  arrivalAirportId: z.string().min(1, "Arrival airport is required"),
  departureDateTime: z.string().min(1, "Departure date/time is required"),
});

export const charterQuoteRequestSchema = z.object({
  clientName: z.string().min(2, "Name is required"),
  clientEmail: emailSchema,
  clientPhone: phoneSchema,
  flightType: z.enum(["ONE_WAY", "ROUND_TRIP", "MULTI_LEG"]),
  passengerCount: z.number().int().min(1, "At least 1 passenger required"),
  specialRequests: z.string().optional(),
  legs: z.array(charterLegSchema).min(1, "At least one leg is required"),
  selectedAircraftIds: z
    .array(z.string())
    .min(1)
    .max(5, "Select up to 5 aircraft"),
});

export const approveCharterQuoteSchema = z.object({
  legs: z.array(
    z.object({
      legId: z.string(),
      aircraftId: z.string(),
      priceNgn: z.number().min(0),
      priceUsd: z.number().min(0),
      estimatedDurationMin: z.number().int().min(1),
    }),
  ),
});

export const rejectQuoteSchema = z.object({
  reason: z.enum([
    "AIRCRAFT_UNAVAILABLE",
    "ROUTE_NOT_SERVICEABLE",
    "INVALID_DATES",
    "PRICING_ISSUE",
    "CAPACITY_EXCEEDED",
    "DEAL_NOT_AVAILABLE",
    "NO_PAYMENT_MADE",
    "OTHER",
  ]),
  note: z.string().optional(),
});

// Empty Leg validators
export const createEmptyLegSchema = z.object({
  departureAirportId: z.string().min(1, "Departure airport is required"),
  arrivalAirportId: z.string().min(1, "Arrival airport is required"),
  departureDateTime: z.string().min(1, "Departure date/time is required"),
  aircraftId: z.string().min(1, "Aircraft is required"),
  totalSeats: z.number().int().min(1, "At least 1 seat required"),
  originalPrice: z.number().min(0),
  discountPrice: z.number().min(0),
});

export const updateEmptyLegSchema = createEmptyLegSchema.partial().extend({
  status: z.enum(["PUBLISHED", "OPEN", "CLOSED"]).optional(),
});

export const emptyLegBookingRequestSchema = z.object({
  clientName: z.string().min(2, "Name is required"),
  clientEmail: emailSchema,
  clientPhone: phoneSchema,
  seatsRequested: z.number().int().min(1, "At least 1 seat required"),
});

// Settings validators
export const updateSettingsSchema = z.object({
  paymentWindowHours: z.number().int().min(1).optional(),
  dealDeadlineMinutes: z.number().int().min(15).optional(),
  minimumBookingNoticeHours: z.number().int().min(1).optional(),
  defaultOperatorCommission: z.number().min(0).max(100).optional(),
  cancellationPolicy: z.string().optional(),
  refundPolicy: z.string().optional(),
  termsAndConditions: z.string().optional(),
  privacyPolicy: z.string().optional(),
  supportEmail: emailSchema.optional(),
  supportPhone: phoneSchema.optional(),
});

// Announcement validators
export const createAnnouncementSchema = z.object({
  title: z.string().min(2, "Title is required"),
  message: z.string().min(10, "Message must be at least 10 characters"),
  imageUrl: z.string().url().optional(),
});

// Subscription validators
export const createSubscriptionSchema = z
  .object({
    phone: phoneSchema,
    email: emailSchema.optional(),
    fullName: z.string().optional(),
    type: z.enum(["CITY", "ROUTE", "ALL"]),
    departureCityId: z.string().optional(),
    arrivalCityId: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.type === "CITY" && !data.departureCityId) {
        return false;
      }
      if (
        data.type === "ROUTE" &&
        (!data.departureCityId || !data.arrivalCityId)
      ) {
        return false;
      }
      return true;
    },
    {
      message:
        "City subscription requires departure city, Route subscription requires both cities",
    },
  );

// Profile validators
export const updateProfileSchema = z.object({
  fullName: z.string().min(2).optional(),
  username: usernameSchema.optional(),
  phone: phoneSchema.optional(),
  avatar: z.string().url().optional(),
});

// Type exports
export type LoginInput = z.infer<typeof loginSchema>;
export type CreateAdminInput = z.infer<typeof createAdminSchema>;
export type UpdateAdminInput = z.infer<typeof updateAdminSchema>;
export type CreateOperatorInput = z.infer<typeof createOperatorSchema>;
export type UpdateOperatorInput = z.infer<typeof updateOperatorSchema>;
export type CreateAircraftInput = z.infer<typeof createAircraftSchema>;
export type UpdateAircraftInput = z.infer<typeof updateAircraftSchema>;
export type CharterQuoteRequestInput = z.infer<
  typeof charterQuoteRequestSchema
>;
export type ApproveCharterQuoteInput = z.infer<
  typeof approveCharterQuoteSchema
>;
export type RejectQuoteInput = z.infer<typeof rejectQuoteSchema>;
export type CreateEmptyLegInput = z.infer<typeof createEmptyLegSchema>;
export type UpdateEmptyLegInput = z.infer<typeof updateEmptyLegSchema>;
export type EmptyLegBookingRequestInput = z.infer<
  typeof emptyLegBookingRequestSchema
>;
export type UpdateSettingsInput = z.infer<typeof updateSettingsSchema>;
export type CreateAnnouncementInput = z.infer<typeof createAnnouncementSchema>;
export type CreateSubscriptionInput = z.infer<typeof createSubscriptionSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
