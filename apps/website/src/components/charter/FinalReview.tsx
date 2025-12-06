// components/charter/FinalReview.tsx
"use client";
import { useState, useEffect } from "react";
import { Button } from "@pexjet/ui";
import { ArrowLeft, Check, DollarSign, Loader2 } from "lucide-react";

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
  const [usdToNgnRate, setUsdToNgnRate] = useState(1650);
  const [priceRanges, setPriceRanges] = useState<{
    minPriceUsd: number;
    maxPriceUsd: number;
    minPriceNgn: number;
    maxPriceNgn: number;
    estimatedHours: number;
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

  // Calculate price ranges
  useEffect(() => {
    if (!selectedAircraft || selectedAircraft.length === 0 || !searchData) {
      setPriceRanges(null);
      return;
    }

    // Get flights
    const flights = searchData.flights || [
      { from: searchData.departureAirport, to: searchData.destinationAirport },
    ];

    // For round trip, count as 2 legs
    const legCount = searchData.tripType === "roundTrip" ? 2 : flights.length;

    // Estimate 2 hours per leg as baseline
    const estimatedHours = 2 * legCount;

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

    const minPriceUsd = minHourlyRate * estimatedHours;
    const maxPriceUsd = maxHourlyRate * estimatedHours;

    setPriceRanges({
      minPriceUsd,
      maxPriceUsd,
      minPriceNgn: minPriceUsd * usdToNgnRate,
      maxPriceNgn: maxPriceUsd * usdToNgnRate,
      estimatedHours,
    });
  }, [selectedAircraft, searchData, usdToNgnRate]);

  // Format currency
  const formatCurrency = (amount: number, currency: "USD" | "NGN") => {
    if (currency === "USD") {
      return `$${amount.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
    }
    return `₦${amount.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
  };

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

          {/* Estimated Price Range */}
          {priceRanges && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
                Estimated Price Range
              </h3>
              <div className="bg-[#D4AF37]/10 p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-700 flex items-center gap-2">
                    <DollarSign className="w-4 h-4" />
                    USD:
                  </span>
                  <span className="font-bold text-lg text-[#D4AF37]">
                    {formatCurrency(priceRanges.minPriceUsd, "USD")} -{" "}
                    {formatCurrency(priceRanges.maxPriceUsd, "USD")}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-700 flex items-center gap-2">
                    <DollarSign className="w-4 h-4" />
                    NGN:
                  </span>
                  <span className="font-bold text-lg text-[#D4AF37]">
                    {formatCurrency(priceRanges.minPriceNgn, "NGN")} -{" "}
                    {formatCurrency(priceRanges.maxPriceNgn, "NGN")}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  * Estimated based on ~{priceRanges.estimatedHours} flight
                  hours. Final price will be confirmed by our team.
                </p>
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
