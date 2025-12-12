// Form Types for Admin Dashboard

// Admin Management
export interface CreateAdminForm {
  email: string;
  username: string;
  fullName: string;
  phone: string;
  role: "SUPER_ADMIN" | "STAFF";
  address?: string;
}

export interface UpdateAdminForm {
  email?: string;
  username?: string;
  fullName?: string;
  phone?: string;
  role?: "SUPER_ADMIN" | "STAFF";
  address?: string;
  avatar?: string;
}

// Operator Management
export interface CreateOperatorForm {
  email: string;
  username: string;
  fullName: string;
  phone: string;
  bankName: string;
  bankAccountNumber: string;
  bankAccountName: string;
  commissionPercent: number;
}

export interface UpdateOperatorForm {
  email?: string;
  username?: string;
  fullName?: string;
  phone?: string;
  bankName?: string;
  bankAccountNumber?: string;
  bankAccountName?: string;
  commissionPercent?: number;
  avatar?: string;
}

// Aircraft Management
export interface CreateAircraftForm {
  name: string;
  manufacturer: string;
  model: string;
  category: string;
  availability: string;
  passengerCapacityMin: number;
  passengerCapacityMax: number;
  rangeNm: number;
  cruiseSpeedKnots: number;
  baggageCapacityCuFt?: number;
  cabinLengthFt?: number;
  cabinWidthFt?: number;
  cabinHeightFt?: number;
  lengthFt?: number;
  wingspanFt?: number;
  heightFt?: number;
  yearOfManufacture?: number;
  hourlyRateUsd?: number;
  description?: string;
  exteriorImages?: string[];
  interiorImages?: string[];
  thumbnailImage?: string;
}

export interface UpdateAircraftForm extends Partial<CreateAircraftForm> {}

// Charter Quote
export interface CharterQuoteRequestForm {
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  flightType: "ONE_WAY" | "ROUND_TRIP" | "MULTI_LEG";
  passengerCount: number;
  specialRequests?: string;
  legs: CharterLegForm[];
  selectedAircraftIds: string[];
}

export interface CharterLegForm {
  departureAirportId: string;
  arrivalAirportId: string;
  departureDateTime: string;
}

export interface ApproveCharterQuoteForm {
  legs: {
    legId: string;
    aircraftId: string;
    priceNgn: number;
    priceUsd: number;
    estimatedDurationMin: number;
  }[];
}

export interface RejectQuoteForm {
  reason: string;
  note?: string;
}

// Empty Leg
export interface CreateEmptyLegForm {
  departureAirportId: string;
  arrivalAirportId: string;
  departureDateTime: string;
  aircraftId: string;
  totalSeats: number;
  originalPrice: number;
  discountPrice: number;
}

export interface UpdateEmptyLegForm extends Partial<CreateEmptyLegForm> {
  status?: string;
}

// Empty Leg Booking Request (from website)
export interface EmptyLegBookingRequestForm {
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  seatsRequested: number;
}

// Settings
export interface UpdateSettingsForm {
  paymentWindowHours?: number;
  dealDeadlineMinutes?: number;
  minimumBookingNoticeHours?: number;
  defaultOperatorCommission?: number;
  cancellationPolicy?: string;
  refundPolicy?: string;
  termsAndConditions?: string;
  privacyPolicy?: string;
  supportEmail?: string;
  supportPhone?: string;
}

// Announcement
export interface CreateAnnouncementForm {
  title: string;
  message: string;
  imageUrl?: string;
}

// Subscription (from website)
export interface CreateSubscriptionForm {
  phone: string;
  email?: string;
  fullName?: string;
  type: "CITY" | "ROUTE" | "ALL";
  departureCityId?: string;
  arrivalCityId?: string;
}
