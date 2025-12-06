// components/charter/FlightSummary.tsx
"use client";
import { useState, useEffect } from "react";
import { Card, Button } from "@pexjet/ui";
import {
  MapPin,
  Calendar,
  Users,
  Clock,
  DollarSign,
  ChevronLeft,
  ChevronRight,
  ArrowDown,
  ArrowUp,
} from "lucide-react";

// Haversine formula to calculate distance between two points
function calculateDistanceNm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 3440.065; // Earth's radius in nautical miles
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

interface FlightSummaryProps {
  formData: any;
  currentStep: number;
}

export function FlightSummary({ formData, currentStep }: FlightSummaryProps) {
  const { searchData, selectedAircraft, contactInfo } = formData;
  const [currentFlightIndex, setCurrentFlightIndex] = useState(0);
  const [usdToNgnRate, setUsdToNgnRate] = useState(1650);
  const [priceRanges, setPriceRanges] = useState<{
    minPriceUsd: number;
    maxPriceUsd: number;
    minPriceNgn: number;
    maxPriceNgn: number;
    minFlightHours: number;
    maxFlightHours: number;
  } | null>(null);

  // Fetch USD to NGN rate
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch("/api/settings");
        if (response.ok) {
          const data = await response.json();
          setUsdToNgnRate(data.usdToNgnRate || 1650);
        }
      } catch (error) {
        console.error("Failed to fetch settings:", error);
      }
    };
    fetchSettings();
  }, []);

  // Calculate price ranges based on aircraft hourly rates and estimated flight hours
  useEffect(() => {
    if (!selectedAircraft || selectedAircraft.length === 0 || !searchData) {
      setPriceRanges(null);
      return;
    }

    const calculatePriceRanges = async () => {
      try {
        // Get flights
        const flights = searchData.flights || [
          {
            from: searchData.departureAirport,
            to: searchData.destinationAirport,
          },
        ];

        // For round trip, count as 2 legs
        const legCount =
          searchData.tripType === "roundTrip" ? 2 : flights.length;

        // Estimate total flight hours (we'll use a rough estimate based on average speed)
        // In a real scenario, you'd calculate distance between airports
        // For now, estimate 2 hours per leg as a baseline
        const estimatedHoursPerLeg = 2;
        const totalEstimatedHours = estimatedHoursPerLeg * legCount;

        // Get hourly rates from selected aircraft
        const hourlyRates = selectedAircraft
          .map((a: any) => a.hourlyRateUsd || 0)
          .filter((rate: number) => rate > 0);

        if (hourlyRates.length === 0) {
          setPriceRanges(null);
          return;
        }

        const minHourlyRate = Math.min(...hourlyRates);
        const maxHourlyRate = Math.max(...hourlyRates);

        // Calculate price range (hourly rate × flight hours)
        const minPriceUsd = minHourlyRate * totalEstimatedHours;
        const maxPriceUsd = maxHourlyRate * totalEstimatedHours;

        setPriceRanges({
          minPriceUsd,
          maxPriceUsd,
          minPriceNgn: minPriceUsd * usdToNgnRate,
          maxPriceNgn: maxPriceUsd * usdToNgnRate,
          minFlightHours: totalEstimatedHours,
          maxFlightHours: totalEstimatedHours,
        });
      } catch (error) {
        console.error("Error calculating price ranges:", error);
        setPriceRanges(null);
      }
    };

    calculatePriceRanges();
  }, [selectedAircraft, searchData, usdToNgnRate]);

  if (!searchData) return null;

  // Helper function to format date for display
  const formatDateForDisplay = (dateString: string | null) => {
    if (!dateString) return "Not selected";

    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return dateString;
    }
  };

  // Format currency
  const formatCurrency = (amount: number, currency: "USD" | "NGN") => {
    if (currency === "USD") {
      return `$${amount.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
    }
    return `₦${amount.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
  };

  // Get flights array - handle both data structures
  const getFlights = () => {
    if (searchData.flights) {
      return searchData.flights;
    }
    // Fallback for old data structure
    return [
      {
        id: "1",
        from: searchData.departureAirport,
        to: searchData.destinationAirport,
        date: searchData.departureDate,
        returnDate: searchData.returnDate,
        time: searchData.departureTime,
        returnTime: searchData.returnTime,
        passengers: searchData.passengers,
      },
    ];
  };

  // Get trip type - handle both data structures
  const getTripType = () => {
    return searchData.tripType || "oneWay";
  };

  // Get passenger count
  const getPassengerCount = () => {
    return (
      searchData.passengers ||
      (searchData.flights && searchData.flights[0]?.passengers) ||
      1
    );
  };

  const flights = getFlights();
  const tripType = getTripType();
  const passengerCount = getPassengerCount();
  const isMultiLeg = tripType === "multiLeg" && flights.length > 1;
  const isRoundTrip = tripType === "roundTrip";

  // Navigation for multi-leg carousel
  const nextFlight = () => {
    setCurrentFlightIndex((prev) => (prev + 1) % flights.length);
  };

  const prevFlight = () => {
    setCurrentFlightIndex(
      (prev) => (prev - 1 + flights.length) % flights.length,
    );
  };

  const goToFlight = (index: number) => {
    setCurrentFlightIndex(index);
  };

  const currentFlight = flights[currentFlightIndex];

  return (
    <Card className="border border-[#D4AF37]/20 p-6 bg-white/95 backdrop-blur-sm sticky top-6">
      <p className="text-xl font-bold text-gray-900 mb-6 border-b pb-2">
        Flight Summary
      </p>

      {/* Multi-leg Carousel Navigation */}
      {isMultiLeg && (
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={prevFlight}
              className="h-8 w-8 p-0"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <div className="text-sm font-medium">
              Leg {currentFlightIndex + 1} of {flights.length}
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={nextFlight}
              className="h-8 w-8 p-0"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Dot indicators */}
          <div className="flex justify-center gap-1">
            {(
              flights as Array<{
                id?: string;
                from?: string;
                to?: string;
                date?: string;
                returnDate?: string;
                time?: string;
                returnTime?: string;
                passengers?: number;
              }>
            ).map(
              (
                _: {
                  id?: string;
                  from?: string;
                  to?: string;
                  date?: string;
                  returnDate?: string;
                  time?: string;
                  returnTime?: string;
                  passengers?: number;
                },
                index: number,
              ) => (
                <button
                  key={index}
                  onClick={() => goToFlight(index)}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    index === currentFlightIndex
                      ? "bg-[#D4AF37]"
                      : "bg-gray-300"
                  }`}
                />
              ),
            )}
          </div>
        </div>
      )}

      {/* Flight Route */}
      <div className="space-y-4">
        {isMultiLeg ? (
          // Multi-leg display with carousel
          <div className="space-y-4">
            {/* From */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-[#D4AF37] rounded-full flex items-center justify-center">
                  <MapPin className="w-4 h-4 text-white" />
                </div>
                <div>
                  <div className="font-semibold text-gray-900">From</div>
                  <div className="text-sm text-gray-600">
                    {currentFlight.from || "Not selected"}
                  </div>
                </div>
              </div>
            </div>

            {/* Vertical Line + Double Arrow Down */}
            <div className="flex justify-center">
              <div className="relative flex flex-col items-center">
                <div className="w-0.5 h-4 bg-gray-300" />
                <div className="flex flex-col items-center my-1">
                  <ArrowDown className="w-4 h-4 text-gray-400" />
                  <ArrowDown className="w-4 h-4 text-gray-400 -mt-1" />
                </div>
                <div className="w-0.5 h-4 bg-gray-300" />
              </div>
            </div>

            {/* To */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-[#D4AF37] rounded-full flex items-center justify-center">
                  <MapPin className="w-4 h-4 text-white" />
                </div>
                <div>
                  <div className="font-semibold text-gray-900">To</div>
                  <div className="text-sm text-gray-600">
                    {currentFlight.to || "Not selected"}
                  </div>
                </div>
              </div>
            </div>

            {/* Flight Date & Time */}
            {currentFlight.date && (
              <div className="flex items-center justify-between text-sm bg-gray-50 p-2 rounded">
                <div className="flex items-center gap-2 text-gray-700">
                  <Calendar className="w-3 h-3" />
                  <span>Date & Time:</span>
                </div>
                <span className="font-medium text-right">
                  {formatDateForDisplay(currentFlight.date)}
                  {currentFlight.time && <br />}
                  {currentFlight.time && `at ${currentFlight.time}`}
                </span>
              </div>
            )}

            {/* Passengers for current leg */}
            <div className="flex items-center justify-between text-sm bg-gray-50 p-2 rounded">
              <div className="flex items-center gap-2 text-gray-700">
                <Users className="w-3 h-3" />
                <span>Passengers:</span>
              </div>
              <span className="font-medium">
                {currentFlight.passengers || passengerCount}
              </span>
            </div>
          </div>
        ) : isRoundTrip ? (
          // Round trip display with double arrows (down and up)
          <div className="space-y-4">
            {/* Outbound Flight */}
            <div className="space-y-3">
              <div className="text-sm font-semibold text-gray-700 bg-gray-100 px-3 py-1 rounded">
                Outbound Flight
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-[#D4AF37] rounded-full flex items-center justify-center">
                    <MapPin className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">Departure</div>
                    <div className="text-sm text-gray-600">
                      {flights[0]?.from || "Not selected"}
                    </div>
                  </div>
                </div>
              </div>

              {/* Double Arrow Down */}
              <div className="flex justify-center">
                <div className="relative flex flex-col items-center">
                  <div className="w-0.5 h-4 bg-gray-300" />
                  <div className="flex flex-col items-center my-1">
                    <ArrowDown className="w-4 h-4 text-gray-400" />
                    <ArrowDown className="w-4 h-4 text-gray-400 -mt-1" />
                  </div>
                  <div className="w-0.5 h-4 bg-gray-300" />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-[#D4AF37] rounded-full flex items-center justify-center">
                    <MapPin className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">
                      Destination
                    </div>
                    <div className="text-sm text-gray-600">
                      {flights[0]?.to || "Not selected"}
                    </div>
                  </div>
                </div>
              </div>

              {flights[0]?.date && (
                <div className="flex items-center justify-between text-sm bg-gray-50 p-2 rounded">
                  <div className="flex items-center gap-2 text-gray-700">
                    <Calendar className="w-3 h-3" />
                    <span>Departure:</span>
                  </div>
                  <span className="font-medium text-right">
                    {formatDateForDisplay(flights[0].date)}
                    {flights[0].time && <br />}
                    {flights[0].time && `at ${flights[0].time}`}
                  </span>
                </div>
              )}
            </div>

            {/* Return Flight */}
            <div className="space-y-3">
              <div className="text-sm font-semibold text-gray-700 bg-gray-100 px-3 py-1 rounded">
                Return Flight
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-[#D4AF37] rounded-full flex items-center justify-center">
                    <MapPin className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">Departure</div>
                    <div className="text-sm text-gray-600">
                      {flights[0]?.to || "Not selected"}
                    </div>
                  </div>
                </div>
              </div>

              {/* Double Arrow Up */}
              <div className="flex justify-center">
                <div className="relative flex flex-col items-center">
                  <div className="w-0.5 h-4 bg-gray-300" />
                  <div className="flex flex-col items-center my-1">
                    <ArrowUp className="w-4 h-4 text-gray-400" />
                    <ArrowUp className="w-4 h-4 text-gray-400 -mt-1" />
                  </div>
                  <div className="w-0.5 h-4 bg-gray-300" />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-[#D4AF37] rounded-full flex items-center justify-center">
                    <MapPin className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">
                      Destination
                    </div>
                    <div className="text-sm text-gray-600">
                      {flights[0]?.from || "Not selected"}
                    </div>
                  </div>
                </div>
              </div>

              {flights[0]?.returnDate && (
                <div className="flex items-center justify-between text-sm bg-gray-50 p-2 rounded">
                  <div className="flex items-center gap-2 text-gray-700">
                    <Calendar className="w-3 h-3" />
                    <span>Return:</span>
                  </div>
                  <span className="font-medium text-right">
                    {formatDateForDisplay(flights[0].returnDate)}
                    {flights[0].returnTime && <br />}
                    {flights[0].returnTime && `at ${flights[0].returnTime}`}
                  </span>
                </div>
              )}
            </div>
          </div>
        ) : (
          // Single leg display
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-[#D4AF37] rounded-full flex items-center justify-center">
                  <MapPin className="w-4 h-4 text-white" />
                </div>
                <div>
                  <div className="font-semibold text-gray-900">Departure</div>
                  <div className="text-sm text-gray-600">
                    {flights[0]?.from || "Not selected"}
                  </div>
                </div>
              </div>
            </div>

            {/* Double Arrow Down */}
            <div className="flex justify-center">
              <div className="relative flex flex-col items-center">
                <div className="w-0.5 h-4 bg-gray-300" />
                <div className="flex flex-col items-center my-1">
                  <ArrowDown className="w-4 h-4 text-gray-400" />
                  <ArrowDown className="w-4 h-4 text-gray-400 -mt-1" />
                </div>
                <div className="w-0.5 h-4 bg-gray-300" />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-[#D4AF37] rounded-full flex items-center justify-center">
                  <MapPin className="w-4 h-4 text-white" />
                </div>
                <div>
                  <div className="font-semibold text-gray-900">Destination</div>
                  <div className="text-sm text-gray-600">
                    {flights[0]?.to || "Not selected"}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Flight Details */}
      <div className="space-y-3 mt-6 pt-4 border-t border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-gray-800">
            <Calendar className="w-4 h-4" />
            <p>Trip Type:</p>
          </div>
          <p className="font-medium capitalize">
            {tripType?.replace(/([A-Z])/g, " $1").trim() || "One Way"}
          </p>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-gray-800">
            <Users className="w-4 h-4" />
            <p>Passengers:</p>
          </div>
          <p className="font-medium">{passengerCount}</p>
        </div>

        {/* Single leg and round trip dates */}
        {!isMultiLeg && flights[0]?.date && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-gray-800">
              <Clock className="w-4 h-4" />
              <p>Departure:</p>
            </div>
            <p className="font-medium text-sm text-right">
              {formatDateForDisplay(flights[0].date)}
              {flights[0].time && <br />}
              {flights[0].time && `at ${flights[0].time}`}
            </p>
          </div>
        )}

        {isRoundTrip && flights[0]?.returnDate && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-gray-800">
              <Clock className="w-4 h-4" />
              <p>Return:</p>
            </div>
            <p className="font-medium text-sm text-right">
              {formatDateForDisplay(flights[0].returnDate)}
              {flights[0].returnTime && <br />}
              {flights[0].returnTime && `at ${flights[0].returnTime}`}
            </p>
          </div>
        )}

        {/* Price Range */}
        {priceRanges && (
          <div className="space-y-2 pt-2 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-gray-800">
                <DollarSign className="w-4 h-4" />
                <p className="font-medium">Est. Price (USD):</p>
              </div>
              <p className="font-semibold text-[#D4AF37]">
                {formatCurrency(priceRanges.minPriceUsd, "USD")} -{" "}
                {formatCurrency(priceRanges.maxPriceUsd, "USD")}
              </p>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-gray-800">
                <DollarSign className="w-4 h-4" />
                <p className="font-medium">Est. Price (NGN):</p>
              </div>
              <p className="font-semibold text-[#D4AF37]">
                {formatCurrency(priceRanges.minPriceNgn, "NGN")} -{" "}
                {formatCurrency(priceRanges.maxPriceNgn, "NGN")}
              </p>
            </div>
            {isMultiLeg && (
              <p className="text-xs text-gray-500 text-right">
                ({flights.length} legs total)
              </p>
            )}
          </div>
        )}

        {/* Flight Time Estimate */}
        {priceRanges && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-gray-800">
              <Clock className="w-4 h-4" />
              <p className="font-medium">Est. Flight Time:</p>
            </div>
            <p className="font-medium">~{priceRanges.minFlightHours} hrs</p>
          </div>
        )}
      </div>

      {/* Selected Aircraft */}
      {selectedAircraft && selectedAircraft.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <p className="font-semibold text-gray-800 mb-2">
            Selected Aircraft ({selectedAircraft.length})
          </p>
          <div className="flex flex-col gap-2">
            {selectedAircraft.map((aircraft: any, index: number) => (
              <div
                key={aircraft.id || index}
                className="text-sm bg-gray-50 p-2 rounded border"
              >
                <div className="font-medium text-gray-700">{aircraft.name}</div>
                {aircraft.price && (
                  <div className="text-xs text-gray-600 mt-1">
                    Price:{" "}
                    <span className="font-semibold">{aircraft.price}</span>
                  </div>
                )}
                {aircraft.flightTime && (
                  <div className="text-xs text-gray-600">
                    Flight Time:{" "}
                    <span className="font-semibold">{aircraft.flightTime}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Contact Information */}
      {contactInfo && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <p className="font-semibold text-gray-800 mb-2">Contact Details</p>
          <div className="space-y-2 text-sm bg-gray-50 p-3 rounded border">
            <div className="flex justify-between">
              <span className="text-gray-600">Name:</span>
              <span className="font-medium">
                {contactInfo.firstName} {contactInfo.lastName}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Email:</span>
              <span className="font-medium">{contactInfo.email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Phone:</span>
              <span className="font-medium">{contactInfo.phone}</span>
            </div>
            {contactInfo.company && (
              <div className="flex justify-between">
                <span className="text-gray-600">Company:</span>
                <span className="font-medium">{contactInfo.company}</span>
              </div>
            )}
            {contactInfo.notes && (
              <div className="pt-2 border-t border-gray-200">
                <div className="text-gray-600 mb-1">Notes:</div>
                <div className="text-xs text-gray-700 bg-white p-2 rounded border">
                  {contactInfo.notes}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Progress Indicator */}
      <div className="mt-4 pt-4 border-t border-dashed border-gray-200">
        <div className="flex justify-between items-center text-sm">
          <span className="text-gray-600">Current Step:</span>
          <span className="font-semibold text-gray-500">
            {currentStep === 1 && "Aircraft Selection"}
            {currentStep === 2 && "Contact Details"}
            {currentStep === 3 && "Review & Submit"}
          </span>
        </div>
      </div>
    </Card>
  );
}
