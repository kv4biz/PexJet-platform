// components/charter/FinalReview.tsx
"use client";
import { useState, useEffect } from "react";
import { Button } from "@pexjet/ui";
import {
  ArrowLeft,
  Check,
  Loader2,
  Clock,
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

interface FinalReviewProps {
  formData: any;
  onSubmit: () => void;
  onBack: () => void;
  isSubmitting?: boolean;
}

export function FinalReview({
  formData,
  onSubmit,
  onBack,
  isSubmitting = false,
}: FinalReviewProps) {
  const { searchData, selectedAircraft, contactInfo } = formData;
  const [flightInfo, setFlightInfo] = useState<{
    distanceNm: number;
    flightTimeHours: number;
    arrivalTime: string;
  } | null>(null);
  const [priceEstimate, setPriceEstimate] = useState<{
    minPriceUsd: number;
    maxPriceUsd: number;
  } | null>(null);

  // Calculate price estimate based on aircraft hourly rates and flight time
  useEffect(() => {
    if (!selectedAircraft || selectedAircraft.length === 0 || !flightInfo) {
      setPriceEstimate(null);
      return;
    }

    const hourlyRates = selectedAircraft
      .map((a: any) => a.hourlyRateUsd || 0)
      .filter((rate: number) => rate > 0);

    if (hourlyRates.length === 0) {
      setPriceEstimate(null);
      return;
    }

    const minHourlyRate = Math.min(...hourlyRates);
    const maxHourlyRate = Math.max(...hourlyRates);
    const flightHours = flightInfo.flightTimeHours;

    setPriceEstimate({
      minPriceUsd: minHourlyRate * flightHours,
      maxPriceUsd: maxHourlyRate * flightHours,
    });
  }, [selectedAircraft, flightInfo]);

  // Format currency
  const formatCurrency = (amount: number) => {
    return `$${amount.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
  };

  // Calculate distance and flight time
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

        let totalDistanceNm = 0;

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
                  totalDistanceNm += distance;
                }
              } catch (err) {
                console.error("Error fetching airport coordinates:", err);
              }
            }
          }
        }

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

  // Get flights array
  const getFlights = () => {
    if (searchData.flights) {
      return searchData.flights;
    }
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

  const flights = getFlights();
  const isMultiLeg = searchData.tripType === "multiLeg" && flights.length > 1;
  const isRoundTrip = searchData.tripType === "roundTrip";

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Review Your Charter Request
        </h2>
        <p className="text-gray-600">
          Please review all details before submitting
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Flight Details */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
            Flight Details
          </h3>

          {isMultiLeg ? (
            // Multi-leg display
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-gray-600">Trip Type:</span>
                <span className="font-medium capitalize">Multi-Leg</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Total Legs:</span>
                <span className="font-medium">{flights.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Passengers:</span>
                <span className="font-medium">{searchData.passengers}</span>
              </div>

              {/* Display all flight legs */}
              <div className="space-y-3 mt-4">
                <h4 className="font-medium text-gray-800">Flight Legs:</h4>
                {flights.map((flight: any, index: number) => (
                  <div key={flight.id} className="bg-gray-50 p-3 border">
                    <div className="font-medium text-sm mb-2">
                      Leg {index + 1}
                    </div>
                    <div className="text-sm space-y-1">
                      <div className="flex justify-between">
                        <span className="text-gray-600">From:</span>
                        <span className="font-medium">{flight.from}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">To:</span>
                        <span className="font-medium">{flight.to}</span>
                      </div>
                      {flight.date && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Date:</span>
                          <span className="font-medium">
                            {formatDateForDisplay(flight.date)}
                            {flight.time && ` at ${flight.time}`}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : isRoundTrip ? (
            // Round trip display
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Trip Type:</span>
                <span className="font-medium capitalize">Round Trip</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">From:</span>
                <span className="font-medium">{flights[0]?.from}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">To:</span>
                <span className="font-medium">{flights[0]?.to}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Passengers:</span>
                <span className="font-medium">{searchData.passengers}</span>
              </div>
              {flights[0]?.date && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Departure:</span>
                  <span className="font-medium">
                    {formatDateForDisplay(flights[0].date)}
                    {flights[0].time && ` at ${flights[0].time}`}
                  </span>
                </div>
              )}
              {flights[0]?.returnDate && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Return:</span>
                  <span className="font-medium">
                    {formatDateForDisplay(flights[0].returnDate)}
                    {flights[0].returnTime && ` at ${flights[0].returnTime}`}
                  </span>
                </div>
              )}
            </div>
          ) : (
            // One-way display
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Trip Type:</span>
                <span className="font-medium capitalize">One Way</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">From:</span>
                <span className="font-medium">{flights[0]?.from}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">To:</span>
                <span className="font-medium">{flights[0]?.to}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Passengers:</span>
                <span className="font-medium">{searchData.passengers}</span>
              </div>
              {flights[0]?.date && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Departure:</span>
                  <span className="font-medium">
                    {formatDateForDisplay(flights[0].date)}
                    {flights[0].time && ` at ${flights[0].time}`}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Aircraft & Contact */}
        <div className="space-y-6">
          {/* Selected Aircraft */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
              Selected Aircraft ({selectedAircraft?.length || 0})
            </h3>
            {selectedAircraft && selectedAircraft.length > 0 ? (
              <div className="space-y-2">
                {selectedAircraft.map((aircraft: any) => (
                  <div
                    key={aircraft.id}
                    className="flex items-center gap-3 p-3 bg-gray-50"
                  >
                    {aircraft.exteriorImages?.[0] && (
                      <img
                        src={aircraft.exteriorImages[0]}
                        alt={aircraft.name}
                        className="w-12 h-12 object-cover"
                      />
                    )}
                    <div className="flex-1">
                      <div className="font-semibold">{aircraft.name}</div>
                      <div className="text-sm text-gray-600">
                        {aircraft.passengerCapacity} seats • {aircraft.type}
                        {aircraft.hourlyRateUsd > 0 && (
                          <> • ${aircraft.hourlyRateUsd.toLocaleString()}/hr</>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">No aircraft selected</p>
            )}
          </div>

          {/* Flight Estimates */}
          {(flightInfo || priceEstimate) && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
                Flight Estimates
              </h3>
              <div className="bg-gray-50 p-4 space-y-3">
                {flightInfo && flightInfo.arrivalTime !== "TBD" && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700 flex items-center gap-2">
                      <Plane className="w-4 h-4" />
                      Est. Arrival:
                    </span>
                    <span className="font-bold text-lg text-gray-900">
                      {flightInfo.arrivalTime}
                    </span>
                  </div>
                )}
                {priceEstimate && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700 flex items-center gap-2">
                      <DollarSign className="w-4 h-4" />
                      Est. Price (USD):
                    </span>
                    <span className="font-bold text-lg text-gray-900">
                      {priceEstimate.minPriceUsd === priceEstimate.maxPriceUsd
                        ? formatCurrency(priceEstimate.minPriceUsd)
                        : `${formatCurrency(priceEstimate.minPriceUsd)} - ${formatCurrency(priceEstimate.maxPriceUsd)}`}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Contact Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
              Contact Information
            </h3>
            {contactInfo ? (
              <div className="space-y-2">
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
                  <div className="flex flex-col gap-1 pt-2 border-t border-gray-200">
                    <span className="text-gray-600">Additional Notes:</span>
                    <span className="font-medium text-sm">
                      {contactInfo.notes}
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">
                No contact information provided
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="flex justify-between pt-6 border-t border-gray-200">
        <Button
          type="button"
          variant="outline"
          onClick={onBack}
          className="border-gray-300"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <Button
          onClick={onSubmit}
          disabled={isSubmitting}
          variant={"outline"}
          className="bg-[#D4AF37] px-8"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Submitting...
            </>
          ) : (
            <>
              <Check className="w-4 h-4 mr-2" />
              Submit Request
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
