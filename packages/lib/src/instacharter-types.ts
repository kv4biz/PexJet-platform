/**
 * InstaCharter API Types
 * Based on InstaCharter API documentation
 * API Base URL: https://server.instacharter.app/api/Markets
 */

// =============================================================================
// API Response Types - GetAvailabilities
// =============================================================================

export interface InstaCharterFrom {
  dateFrom: string; // ISO date string e.g. "2025-06-14T00:00:00"
  fromIcao: string;
  fromCity: string;
  lat: number;
  long: number;
}

export interface InstaCharterTo {
  dateTo: string; // ISO date string
  toIcao: string;
  toCity: string;
  lat: number;
  long: number;
}

export interface InstaCharterAircraft {
  aircraft_Category: string;
  aircraft_Type: string;
  availabilityType: string; // "One Way" | "Transient" | "Empty Leg"
  seats: number;
  price: string; // e.g. "$26K" or "230000"
}

export interface InstaCharterCompany {
  id: number;
  companyName: string;
  email: string;
  phone: string;
}

export interface InstaCharterAvailability {
  id: number;
  from: InstaCharterFrom;
  to: InstaCharterTo;
  aircraft: InstaCharterAircraft;
  companyDetails: InstaCharterCompany;
  aircraftImage?: string;
  startDist?: number;
  endDist?: number;
}

export interface GetAvailabilitiesResponse {
  success: boolean;
  statusCode: number;
  message: string;
  data: InstaCharterAvailability[];
}

// =============================================================================
// Internal Types for Sync
// =============================================================================

export interface SyncResult {
  success: boolean;
  dealsFound: number;
  dealsCreated: number;
  dealsUpdated: number;
  dealsRemoved: number;
  errors: string[];
  duration: number;
}

export interface InstaCharterConfig {
  clientId: string;
  apiKey: string;
  baseUrl: string;
}

// =============================================================================
// Mapped Types for Database
// =============================================================================

export interface MappedEmptyLegData {
  externalId: string;
  slug: string;
  source: "INSTACHARTER";
  departureIata?: string | null;
  departureIcao: string;
  departureCity: string;
  departureCountry: string | null;
  arrivalIata?: string | null;
  arrivalIcao: string;
  arrivalCity: string;
  arrivalCountry: string | null;
  departureDateTime: Date;
  aircraftName: string | null;
  aircraftType: string;
  aircraftCategory: string | null;
  aircraftImage: string | null;
  totalSeats: number;
  availableSeats: number;
  priceType: "FIXED" | "CONTACT";
  priceUsd: number | null;
  operatorName: string;
  operatorEmail: string | null;
  operatorPhone: string | null;
  status: "PUBLISHED";
  lastSyncedAt: Date;
}
