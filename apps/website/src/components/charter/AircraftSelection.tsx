// components/charter/AircraftSelection.tsx
"use client";

import React, { useState, useEffect } from "react";
import {
  Button,
  Card,
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@pexjet/ui";
import {
  Check,
  Users,
  Package,
  ArrowRight,
  Gauge,
  Eye,
  Loader2,
  DollarSign,
  X,
  Plane,
  Clock4,
} from "lucide-react";
import { charterPageData } from "@/data";

interface Aircraft {
  id: string;
  name: string;
  manufacturer: string;
  category: string;
  availability: string;
  basePricePerHour: number | null;
  cabinLengthFt: number | null;
  cabinWidthFt: number | null;
  cabinHeightFt: number | null;
  baggageCuFt: number | null;
  exteriorHeightFt: number | null;
  exteriorLengthFt: number | null;
  exteriorWingspanFt: number | null;
  image: string | null;
  maxPax: number | null;
  minPax: number | null;
  cruiseSpeedKnots: number | null;
  fuelCapacityGal: number | null;
  rangeNm: number | null;
  // Legacy fields for backward compatibility
  model: string | null;
  type: string;
  passengerCapacity: number;
  luggageCapacity: string | null;
  cruiseSpeed: string | null;
  range: string | null;
  cabinHeight: string | null;
  cabinWidth: string | null;
  cabinLength: string | null;
  hourlyRateUsd: number;
  exteriorImages: string[];
  interiorImages: string[];
  availableForLocal: boolean;
  availableForInternational: boolean;
}

interface AircraftSelectionProps {
  formData: any;
  onNext: (data: any) => void;
}

export function AircraftSelection({
  formData,
  onNext,
}: AircraftSelectionProps) {
  const [selectedAircraft, setSelectedAircraft] = useState<string[]>([]);
  const [aircraft, setAircraft] = useState<Aircraft[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewingAircraft, setViewingAircraft] = useState<Aircraft | null>(null);
  const [filteredCategories, setFilteredCategories] = useState<
    Record<string, Aircraft[]>
  >({});

  // Group aircraft by category and filter by passenger capacity
  const groupAndFilterAircraft = (
    aircraft: Aircraft[],
    passengerCount: number,
  ) => {
    // Group by aircraft type/category
    const grouped = aircraft.reduce(
      (acc, aircraft) => {
        const category = aircraft.type || "Other";
        if (!acc[category]) {
          acc[category] = [];
        }
        acc[category].push(aircraft);
        return acc;
      },
      {} as Record<string, Aircraft[]>,
    );

    // Filter categories by passenger range and find first qualifying aircraft per category
    const filteredCategories = Object.entries(grouped).reduce(
      (acc, [category, aircrafts]) => {
        // Find the first aircraft in this category that can accommodate the passengers
        const qualifyingAircraft = aircrafts.find((a) => {
          // Use minPax/maxPax if available, otherwise fall back to passengerCapacity
          const minPassengers = a.minPax ?? 1; // Default to 1 if null
          const maxPassengers = a.maxPax ?? a.passengerCapacity; // Use passengerCapacity as fallback

          // Ensure we have valid numbers
          if (
            maxPassengers === 0 ||
            maxPassengers === null ||
            maxPassengers === undefined
          ) {
            return false;
          }

          return (
            minPassengers <= passengerCount && passengerCount <= maxPassengers
          );
        });

        // Only include category if we found at least one qualifying aircraft
        if (qualifyingAircraft) {
          acc[category] = [qualifyingAircraft]; // Only include the first qualifying aircraft
        }
        return acc;
      },
      {} as Record<string, Aircraft[]>,
    );

    return filteredCategories;
  };

  // Fetch aircraft from database (only once)
  useEffect(() => {
    const fetchAircraft = async () => {
      try {
        setLoading(true);
        const response = await fetch("/api/aircraft");
        if (!response.ok) {
          throw new Error("Failed to fetch aircraft");
        }
        const data = await response.json();

        // Set all aircraft
        setAircraft(data.aircraft || []);
      } catch (err: any) {
        console.error("Error fetching aircraft:", err);
        setError(err.message || "Failed to load aircraft");
      } finally {
        setLoading(false);
      }
    };

    fetchAircraft();
  }, []); // Only run once on mount

  // Update filtered categories when aircraft or passenger count changes
  useEffect(() => {
    if (aircraft.length > 0) {
      const passengerCount = formData?.passengers || 1;
      setFilteredCategories(groupAndFilterAircraft(aircraft, passengerCount));
    }
  }, [aircraft, formData?.passengers]);

  const handleSelectAircraft = (aircraftId: string) => {
    setSelectedAircraft((prev) => {
      if (prev.includes(aircraftId)) {
        return prev.filter((id) => id !== aircraftId);
      } else if (prev.length < 5) {
        return [...prev, aircraftId];
      }
      return prev;
    });
  };

  const getSelectedCategories = () => {
    return selectedAircraft
      .map((id) => {
        const foundAircraft = aircraft.find((a) => a.id === id);
        return foundAircraft ? foundAircraft.type : null;
      })
      .filter((category): category is string => Boolean(category));
  };

  const getSelectedAircraftDetails = () => {
    return selectedAircraft
      .map((id) => aircraft.find((a) => a.id === id))
      .filter((a): a is Aircraft => Boolean(a));
  };

  const handleContinue = () => {
    if (selectedAircraft.length > 0) {
      const selected = getSelectedAircraftDetails();
      onNext({ selectedAircraft: selected });
    }
  };

  const CategoryRow = ({
    category,
    representative,
    isSelected,
  }: {
    category: string;
    representative: Aircraft | null;
    isSelected: boolean;
  }) => {
    if (!representative) return null;

    // Calculate flight duration (mock calculation - you may want to improve this)
    const calculateFlightDuration = () => {
      // This is a simplified calculation - you might want to use actual route distance
      const avgSpeed = representative.cruiseSpeedKnots || 400; // knots
      const sampleDistance = 500; // sample distance in nm
      const hours = sampleDistance / avgSpeed;
      const minutes = Math.round((hours - Math.floor(hours)) * 60);
      return `${Math.floor(hours)}h ${minutes}m`;
    };

    // Calculate estimated price
    const calculateEstimatedPrice = () => {
      const hourlyRate = representative.hourlyRateUsd || 0;
      const duration = calculateFlightDuration();
      const hours =
        parseFloat(duration.split("h")[0]) +
        parseFloat(duration.split("h")[1]?.split("m")[0] || "0") / 60;
      return Math.round(hourlyRate * hours);
    };

    return (
      <div
        className={`relative ${
          isSelected
            ? "ring-2 ring-[#D4AF37] bg-[#D4AF37]/5"
            : "border border-gray-200"
        } rounded-lg overflow-hidden bg-white`}
      >
        {/* Top Half - Image with Overlay Text */}
        <div className="relative h-48 bg-gray-100">
          {representative.exteriorImages?.[0] ? (
            <img
              src={representative.exteriorImages[0]}
              alt={representative.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              <Plane className="w-16 h-16" />
            </div>
          )}

          {/* Category Type - Top Left */}
          <div className="absolute top-3 left-3 bg-black/70 text-white px-3 py-1 rounded text-sm font-semibold">
            {category}
          </div>

          {/* Aircraft Name - Bottom Left */}
          <div className="absolute bottom-3 left-3 bg-black/70 text-white px-3 py-1 rounded">
            <div className="font-semibold">{representative.name}</div>
          </div>
        </div>

        {/* Bottom Half - Details */}
        <div className="p-4 space-y-3">
          {/* First Row - Passengers & Flight Duration */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Users className="w-4 h-4" />
              <span>
                Up to{" "}
                {representative.maxPax || representative.passengerCapacity}{" "}
                passengers
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Clock4 className="w-4 h-4" />
              <span>{calculateFlightDuration()}</span>
            </div>
          </div>

          {/* Second Row - Price & Button */}
          <div className="space-y-2">
            <div>
              <div className="text-xs text-gray-500">Starting from</div>
              <div className="text-xl font-bold text-[#D4AF37]">
                USD {calculateEstimatedPrice().toLocaleString()}
              </div>
              <div className="text-xs text-gray-500">
                Estimated price excluding taxes and fees
              </div>
            </div>

            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleSelectAircraft(representative.id);
              }}
              type="button"
              className={`w-full py-2 px-4 text-sm font-medium ${
                isSelected
                  ? "bg-gray-500 text-white"
                  : "bg-[#D4AF37] text-black"
              }`}
            >
              {isSelected ? "Selected Category" : "Add to Quote"}
            </button>
          </div>
        </div>
      </div>
    );
  };

  const AircraftRow = ({
    aircraft,
    isSelected,
  }: {
    aircraft: Aircraft;
    isSelected: boolean;
  }) => (
    <div
      className={`grid grid-cols-10 lg:grid-cols-12 gap-2 p-2 border-b border-gray-200 cursor-pointer ${
        isSelected ? "bg-[#D4AF37]/5 border-l-4 border-l-[#D4AF37]" : ""
      }`}
      onClick={() => handleSelectAircraft(aircraft.id)}
    >
      {/* Aircraft Name & Type */}
      <div className="col-span-5 lg:col-span-3 flex items-center gap-3">
        <div
          className={`w-3 h-3 border flex items-center justify-center shrink-0 ${
            isSelected ? "bg-[#D4AF37] border-[#D4AF37]" : "border-gray-300"
          }`}
        >
          {isSelected && <Check className="w-3 h-3 text-white" />}
        </div>
        <div className="min-w-0">
          <div className="font-semibold text-gray-900 truncate">
            {aircraft.name}
          </div>
          <div className="text-xs text-gray-500 truncate">{aircraft.type}</div>
        </div>
      </div>

      {/* Seats (min) - visible on all screens */}
      <div className="col-span-2 flex items-center gap-1 text-sm text-gray-600">
        <Users className="w-4 h-4 shrink-0" />
        <span>{aircraft.passengerCapacity}</span>
      </div>

      {/* Luggage */}
      <div className="col-span-2 hidden lg:flex items-center gap-1 text-sm text-gray-600">
        <Package className="w-4 h-4 shrink-0" />
        <span className="truncate">{aircraft.luggageCapacity || "-"}</span>
      </div>

      {/* Speed */}
      <div className="col-span-2 hidden lg:flex items-center gap-1 text-sm text-gray-600">
        <Gauge className="w-4 h-4 shrink-0" />
        <span className="truncate">{aircraft.cruiseSpeed || "-"}</span>
      </div>

      {/* Hourly Rate USD */}
      <div className="col-span-2 flex items-center gap-1 text-sm text-gray-600">
        <DollarSign className="w-4 h-4 shrink-0" />
        <span className="truncate">
          {aircraft.hourlyRateUsd
            ? `${aircraft.hourlyRateUsd.toLocaleString()}`
            : "-"}
        </span>
      </div>

      {/* View Button */}
      <div className="col-span-1 flex justify-end">
        <button
          onClick={(e) => {
            e.stopPropagation();
            setViewingAircraft(aircraft);
          }}
          className="p-1 text-gray-400"
        >
          <Eye className="w-4 h-4" />
        </button>
      </div>
    </div>
  );

  const TableHeader = () => (
    <div className="grid grid-cols-10 lg:grid-cols-12 gap-2 p-2 bg-gray-50 border-b border-gray-200 text-sm font-semibold text-gray-700">
      <div className="col-span-5 lg:col-span-3">Category</div>
      <div className="col-span-2">Seats</div>
      <div className="col-span-2 hidden lg:block">Luggage</div>
      <div className="col-span-2 hidden lg:block">Speed</div>
      <div className="col-span-2">Rate/hr</div>
      <div className="col-span-1 text-right j">View</div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-4">
        <Loader2 className="w-8 h-8 animate-spin text-[#D4AF37]" />
        <p className="text-gray-600">Loading available aircraft...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-4">
        <p className="text-red-600">{error}</p>
        <Button onClick={() => window.location.reload()} variant="outline">
          Try Again
        </Button>
      </div>
    );
  }

  const formContent = charterPageData.form.aircraftSelection;

  return (
    <div className="space-y-6" id="aircraft-selection-container">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          {formContent.title}
        </h2>
        <p className="text-gray-600">{formContent.subtitle}</p>
        <div className="mt-2 text-sm text-gray-500">
          Selected: {selectedAircraft.length}/{formContent.maxSelection}{" "}
          categories
        </div>
      </div>

      {/* Aircraft Categories List */}
      <div className="space-y-6" id="aircraft-categories-list">
        {Object.keys(filteredCategories).length > 0 ? (
          Object.entries(filteredCategories).map(
            ([category, aircrafts], index) => (
              <CategoryRow
                key={`${category}-${aircrafts[0]?.id || index}`}
                category={category}
                representative={aircrafts[0]}
                isSelected={selectedAircraft.includes(aircrafts[0]?.id || "")}
              />
            ),
          )
        ) : (
          <div className="p-8 text-center text-gray-500">
            {formData?.passengers
              ? `No aircraft available for ${formData.passengers} passengers`
              : "No aircraft available"}
          </div>
        )}
      </div>

      {/* Selected Category Preview */}
      {selectedAircraft.length > 0 && (
        <Card className="p-4 border-[#D4AF37]/20 bg-[#D4AF37]/5">
          <h4 className="font-semibold text-gray-900 lg:mb-3">
            SELECTED CATEGORIES:
          </h4>
          <div className="space-y-2">
            {getSelectedCategories().map((category, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-2 lg:px-3 lg:py-2 border border-[#D4AF37] bg-white"
              >
                <span className="text-sm font-medium">{category}</span>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const aircraftToRemove = getSelectedAircraftDetails().find(
                      (a) => a.type === category,
                    );
                    if (aircraftToRemove) {
                      handleSelectAircraft(aircraftToRemove.id);
                    }
                  }}
                  type="button"
                  className="text-gray-400 hover:text-red-500 text-lg"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </Card>
      )}

      <div className="flex justify-end pt-6 border-t border-gray-200">
        <Button
          onClick={handleContinue}
          variant="outline"
          disabled={selectedAircraft.length === 0}
          className="bg-[#D4AF37]"
        >
          Continue ({selectedAircraft.length} selected)
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>

      {/* Aircraft Detail Dialog */}
      <Dialog
        open={!!viewingAircraft}
        onOpenChange={() => setViewingAircraft(null)}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {viewingAircraft && (
            <>
              <DialogHeader>
                <DialogTitle className="text-xl font-bold">
                  {viewingAircraft.name}
                </DialogTitle>
                <p className="text-sm text-gray-500">{viewingAircraft.type}</p>
              </DialogHeader>

              {/* Thumbnail Image */}
              <div className="mt-4">
                {viewingAircraft.exteriorImages?.[0] ? (
                  <img
                    src={viewingAircraft.exteriorImages[0]}
                    alt={viewingAircraft.name}
                    className="w-full h-48 object-cover"
                  />
                ) : (
                  <div className="w-full h-48 bg-gray-100 flex items-center justify-center text-gray-400">
                    No image available
                  </div>
                )}
              </div>

              {/* Short Description */}
              <div className="mt-4">
                <p className="text-sm text-gray-600">
                  {viewingAircraft.manufacturer &&
                    `${viewingAircraft.manufacturer} `}
                  {viewingAircraft.model || viewingAircraft.name} - A{" "}
                  {viewingAircraft.type.toLowerCase()}
                  with seating for up to {
                    viewingAircraft.passengerCapacity
                  }{" "}
                  passengers.
                  {viewingAircraft.rangeNm > 0 &&
                    ` Range: ${viewingAircraft.range || `${viewingAircraft.rangeNm} nm`}.`}
                </p>
              </div>

              {/* Specifications Grid */}
              <div className="mt-4 grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h4 className="font-semibold text-gray-900">
                    Specifications
                  </h4>
                  <div className="text-sm space-y-1">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Passengers:</span>
                      <span className="text-gray-900">
                        {viewingAircraft.passengerCapacity}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Luggage:</span>
                      <span className="text-gray-900">
                        {viewingAircraft.luggageCapacity || "-"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Speed:</span>
                      <span className="text-gray-900">
                        {viewingAircraft.cruiseSpeed || "-"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Range:</span>
                      <span className="text-gray-900">
                        {viewingAircraft.range || "-"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Hourly Rate:</span>
                      <span className="text-gray-900 font-semibold">
                        $
                        {viewingAircraft.hourlyRateUsd?.toLocaleString() || "-"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="font-semibold text-gray-900">
                    Cabin Dimensions
                  </h4>
                  <div className="text-sm space-y-1">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Height:</span>
                      <span className="text-gray-900">
                        {viewingAircraft.cabinHeight || "-"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Width:</span>
                      <span className="text-gray-900">
                        {viewingAircraft.cabinWidth || "-"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Length:</span>
                      <span className="text-gray-900">
                        {viewingAircraft.cabinLength || "-"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Interior Images */}
              {viewingAircraft.interiorImages?.length > 0 && (
                <div className="mt-4">
                  <h4 className="font-semibold text-gray-900 mb-2">Interior</h4>
                  <div className="grid grid-cols-3 gap-2">
                    {viewingAircraft.interiorImages
                      .slice(0, 3)
                      .map((img, idx) => (
                        <img
                          key={idx}
                          src={img}
                          alt={`${viewingAircraft.name} interior ${idx + 1}`}
                          className="w-full h-20 object-cover"
                        />
                      ))}
                  </div>
                </div>
              )}

              {/* Exterior Images */}
              {viewingAircraft.exteriorImages?.length > 1 && (
                <div className="mt-4">
                  <h4 className="font-semibold text-gray-900 mb-2">Exterior</h4>
                  <div className="grid grid-cols-3 gap-2">
                    {viewingAircraft.exteriorImages
                      .slice(1, 4)
                      .map((img, idx) => (
                        <img
                          key={idx}
                          src={img}
                          alt={`${viewingAircraft.name} exterior ${idx + 1}`}
                          className="w-full h-20 object-cover"
                        />
                      ))}
                  </div>
                </div>
              )}

              {/* Select Button */}
              <div className="mt-6 flex justify-end">
                <Button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleSelectAircraft(viewingAircraft.id);
                    setViewingAircraft(null);
                  }}
                  className="bg-[#D4AF37] text-white hover:bg-[#B8962E]"
                >
                  {selectedAircraft.includes(viewingAircraft.id)
                    ? "Deselect"
                    : "Select"}{" "}
                  Aircraft
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
