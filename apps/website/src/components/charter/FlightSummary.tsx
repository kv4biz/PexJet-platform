// components/charter/FlightSummary.tsx
"use client";
import { useState, useEffect } from "react";
import { Card, Button } from "@pexjet/ui";
import {
  MapPin,
  Calendar,
  Users,
  Clock,
  ChevronLeft,
  ChevronRight,
  ArrowDown,
  ArrowUp,
  Plane,
  DollarSign,
} from "lucide-react";

// Average cruise speed for private jets (knots)
// Using 350 knots as average accounting for climb, descent, and routing
const STANDARD_CRUISE_SPEED_KNOTS = 350;

// Haversine formula to calculate distance between two points in nautical miles
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

// Calculate flight time in hours based on distance and standard cruise speed
function calculateFlightTimeHours(distanceNm: number): number {
  // Add 30 minutes for taxi, takeoff, climb, descent, and landing procedures
  const flightTime = distanceNm / STANDARD_CRUISE_SPEED_KNOTS;
  return flightTime + 0.5; // Add 30 min buffer for ground ops
}

// Format flight time as hours and minutes
function formatFlightTime(hours: number): string {
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  if (h === 0) return `${m} min`;
  if (m === 0) return `${h} hr`;
  return `${h} hr ${m} min`;
}

// Calculate estimated arrival time
function calculateArrivalTime(
  departureTime: string,
  flightTimeHours: number,
): string {
  if (!departureTime) return "TBD";

  const [hours, minutes] = departureTime.split(":").map(Number);
  const departureMinutes = hours * 60 + minutes;
  const arrivalMinutes = departureMinutes + Math.round(flightTimeHours * 60);

  const arrivalHours = Math.floor(arrivalMinutes / 60) % 24;
  const arrivalMins = arrivalMinutes % 60;

  return `${arrivalHours.toString().padStart(2, "0")}:${arrivalMins.toString().padStart(2, "0")}`;
}

interface FlightSummaryProps {
  formData: any;
  currentStep: number;
}

export function FlightSummary({ formData, currentStep }: FlightSummaryProps) {
  const { searchData, selectedAircraft, contactInfo } = formData;
  const [currentFlightIndex, setCurrentFlightIndex] = useState(0);
  const [flightInfo, setFlightInfo] = useState<{
    distanceNm: number;
    flightTimeHours: number;
    arrivalTime: string;
  } | null>(null);
  const [priceRanges, setPriceRanges] = useState<{
    minPriceUsd: number;
    maxPriceUsd: number;
  } | null>(null);

  
  // Calculate price ranges based on aircraft hourly rates and flight time
  useEffect(() => {
    console.log("FlightSummary - Price calc effect:", {
      selectedAircraft: selectedAircraft?.length,
      searchData: !!searchData,
      flightInfo: !!flightInfo,
    });

    if (!selectedAircraft || selectedAircraft.length === 0 || !searchData) {
      setPriceRanges(null);
      return;
    }

    const hourlyRates = selectedAircraft
      .map((a: any) => a.hourlyRateUsd || 0)
      .filter((rate: number) => rate > 0);

    console.log("FlightSummary - Hourly rates:", hourlyRates);

    if (hourlyRates.length === 0) {
      setPriceRanges(null);
      return;
    }

    const minHourlyRate = Math.min(...hourlyRates);
    const maxHourlyRate = Math.max(...hourlyRates);

    // Use calculated flight time if available, otherwise estimate 2 hours per leg
    let flightHours: number;
    if (flightInfo) {
      flightHours = flightInfo.flightTimeHours;
    } else {
      const flights = searchData.flights || [
        {
          from: searchData.departureAirport,
          to: searchData.destinationAirport,
        },
      ];
      const legCount = searchData.tripType === "roundTrip" ? 2 : flights.length;
      flightHours = 2 * legCount; // Fallback: 2 hours per leg
    }

    const minPriceUsd = minHourlyRate * flightHours;
    const maxPriceUsd = maxHourlyRate * flightHours;

    const newPriceRanges = {
      minPriceUsd,
      maxPriceUsd,
    };
    console.log("FlightSummary - Setting price ranges:", newPriceRanges);
    setPriceRanges(newPriceRanges);
  }, [selectedAircraft, flightInfo, searchData]);

  // Calculate distance and flight time when we have airport data
  useEffect(() => {
    if (!searchData) {
      setFlightInfo(null);
      return;
    }

    const calculateFlightInfo = async () => {
      try {
        const flights = searchData.flights || [
          {
            from: searchData.departureAirport,
            to: searchData.destinationAirport,
            time: searchData.departureTime,
          },
        ];

        // For now, we'll use a placeholder distance
        // In production, you'd fetch airport coordinates from the API
        // and calculate actual distance
        let totalDistanceNm = 0;

        // Extract airport info and fetch coordinates
        for (const flight of flights) {
          if (flight.from && flight.to) {
            // Format is "CODE - Name" (e.g., "LOS - Lagos")
            const fromParts = flight.from.split(" - ");
            const toParts = flight.to.split(" - ");
            const fromCode = fromParts[0]?.trim();
            const toCode = toParts[0]?.trim();
            const fromName = fromParts[1]?.trim() || fromParts[0]?.trim();
            const toName = toParts[1]?.trim() || toParts[0]?.trim();

            if (fromName && toName) {
              try {
                console.log("FlightSummary - Fetching airports:", {
                  fromCode,
                  toCode,
                  fromName,
                  toName,
                });
                // Fetch airport coordinates using name for better matching
                const [fromRes, toRes] = await Promise.all([
                  fetch(
                    `/api/airports?q=${encodeURIComponent(fromName)}&limit=10`,
                  ),
                  fetch(
                    `/api/airports?q=${encodeURIComponent(toName)}&limit=10`,
                  ),
                ]);

                const fromData = await fromRes.json();
                const toData = await toRes.json();

                // Find exact match by IATA/ICAO code first, then by name
                const fromAirport =
                  fromData.airports?.find(
                    (a: any) =>
                      a.iataCode === fromCode || a.icaoCode === fromCode,
                  ) ||
                  fromData.airports?.find(
                    (a: any) =>
                      a.municipality?.toLowerCase() ===
                        fromName.toLowerCase() ||
                      a.name?.toLowerCase().includes(fromName.toLowerCase()),
                  ) ||
                  fromData.airports?.[0];
                const toAirport =
                  toData.airports?.find(
                    (a: any) => a.iataCode === toCode || a.icaoCode === toCode,
                  ) ||
                  toData.airports?.find(
                    (a: any) =>
                      a.municipality?.toLowerCase() === toName.toLowerCase() ||
                      a.name?.toLowerCase().includes(toName.toLowerCase()),
                  ) ||
                  toData.airports?.[0];

                console.log("FlightSummary - Airport data:", {
                  fromCode,
                  toCode,
                  fromAirport: fromAirport
                    ? {
                        name: fromAirport.name,
                        lat: fromAirport.latitude,
                        lng: fromAirport.longitude,
                        iata: fromAirport.iataCode,
                      }
                    : null,
                  toAirport: toAirport
                    ? {
                        name: toAirport.name,
                        lat: toAirport.latitude,
                        lng: toAirport.longitude,
                        iata: toAirport.iataCode,
                      }
                    : null,
                });

                if (
                  fromAirport?.latitude &&
                  fromAirport?.longitude &&
                  toAirport?.latitude &&
                  toAirport?.longitude
                ) {
                  const distance = calculateDistanceNm(
                    fromAirport.latitude,
                    fromAirport.longitude,
                    toAirport.latitude,
                    toAirport.longitude,
                  );
                  console.log(
                    "FlightSummary - Calculated distance:",
                    distance,
                    "nm",
                  );
                  totalDistanceNm += distance;
                } else {
                  console.log("FlightSummary - Missing coordinates:", {
                    fromAirport,
                    toAirport,
                  });
                }
              } catch (err) {
                console.error("Error fetching airport coordinates:", err);
              }
            }
          }
        }

        // For round trip, double the distance
        if (searchData.tripType === "roundTrip") {
          totalDistanceNm *= 2;
        }

        if (totalDistanceNm > 0) {
          const flightTimeHours = calculateFlightTimeHours(totalDistanceNm);
          const departureTime = flights[0]?.time || "";
          const arrivalTime = calculateArrivalTime(
            departureTime,
            flightTimeHours,
          );

          setFlightInfo({
            distanceNm: Math.round(totalDistanceNm),
            flightTimeHours,
            arrivalTime,
          });
        } else {
          setFlightInfo(null);
        }
      } catch (error) {
        console.error("Error calculating flight info:", error);
        setFlightInfo(null);
      }
    };

    calculateFlightInfo();
  }, [searchData]);

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

        {/* Est. Arrival & Price */}
        {(flightInfo || priceRanges) && (
          <div className="space-y-2 pt-2 border-t border-gray-200">
            {flightInfo && flightInfo.arrivalTime !== "TBD" && (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-gray-800">
                  <Plane className="w-4 h-4" />
                  <p className="font-medium">Est. Arrival:</p>
                </div>
                <p className="font-semibold text-gray-900">
                  {flightInfo.arrivalTime}
                </p>
              </div>
            )}
            {priceRanges && (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-gray-800">
                  <DollarSign className="w-4 h-4" />
                  <p className="font-medium">Est. Price (USD):</p>
                </div>
                <p className="font-semibold text-gray-900">
                  {priceRanges.minPriceUsd === priceRanges.maxPriceUsd
                    ? formatCurrency(priceRanges.minPriceUsd, "USD")
                    : `${formatCurrency(priceRanges.minPriceUsd, "USD")} - ${formatCurrency(priceRanges.maxPriceUsd, "USD")}`}
                </p>
              </div>
            )}
            {isMultiLeg && (
              <p className="text-xs text-gray-500 text-right">
                ({flights.length} legs total)
              </p>
            )}
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
