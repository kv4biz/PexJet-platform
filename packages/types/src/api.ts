// API Response Types

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ApiError {
  success: false;
  error: string;
  code?: string;
  details?: Record<string, string[]>;
}

// Query Parameters
export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface SearchParams extends PaginationParams {
  search?: string;
}

// Airport Search
export interface AirportSearchParams extends SearchParams {
  countryCode?: string;
  type?: string;
}

// Aircraft Filters
export interface AircraftFilterParams extends SearchParams {
  category?: string;
  availability?: string;
  minPassengers?: number;
  maxPassengers?: number;
}

// Quote Filters
export interface QuoteFilterParams extends SearchParams {
  status?: string;
  flightType?: string;
  fromDate?: string;
  toDate?: string;
}

// Empty Leg Filters
export interface EmptyLegFilterParams extends SearchParams {
  status?: string;
  departureAirportId?: string;
  arrivalAirportId?: string;
  fromDate?: string;
  toDate?: string;
}

// Payment Filters
export interface PaymentFilterParams extends SearchParams {
  status?: string;
  type?: string;
  fromDate?: string;
  toDate?: string;
}

// Activity Log Filters
export interface ActivityLogFilterParams extends SearchParams {
  action?: string;
  adminId?: string;
  fromDate?: string;
  toDate?: string;
}
